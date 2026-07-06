"""
Pipeline Analysis Routes — GitHub-style model inspection, bug detection,
code rewriting, and version history endpoints.
"""
import os
import logging
import joblib
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db, UploadedModel, PipelineAnalysis, PipelineVersion, User
from auth import require_user, require_admin
from pipeline_analyzer import run_full_analysis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pipeline", tags=["Pipeline Analysis"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _get_model_or_404(model_id: int, db: Session) -> UploadedModel:
    m = db.query(UploadedModel).filter(UploadedModel.id == model_id).first()
    if not m:
        raise HTTPException(404, f"Uploaded model {model_id} not found.")
    return m


def _run_analysis_bg(model_id: int, analysis_id: int, db_url: str, username: str):
    """Background task: run full analysis and persist results."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from database import Base

    engine  = create_engine(db_url, connect_args={"check_same_thread": False} if "sqlite" in db_url else {})
    Session = sessionmaker(bind=engine)
    db      = Session()

    try:
        analysis = db.query(PipelineAnalysis).filter(PipelineAnalysis.id == analysis_id).first()
        if not analysis:
            return

        model = db.query(UploadedModel).filter(UploadedModel.id == model_id).first()
        if not model:
            analysis.status = "failed"
            analysis.error_message = "Model not found"
            db.commit()
            return

        analysis.status = "running"
        db.commit()

        clf = joblib.load(model.file_path)
        result = run_full_analysis(clf, model.feature_names, model_id, username)

        # Persist analysis results
        analysis.overall_score   = result["overall_score"]
        analysis.code_quality    = result["code_quality"]
        analysis.data_quality    = result["data_quality"]
        analysis.model_health    = result["model_health"]
        analysis.pipeline_score  = result["pipeline_score"]
        analysis.bugs            = result["bugs"]
        analysis.conflicts       = result["conflicts"]
        analysis.warnings        = result["warnings"]
        analysis.suggestions     = result["suggestions"]
        analysis.model_type      = result["model_type"]
        analysis.hyperparameters = result["hyperparameters"]
        analysis.feature_stats   = result["feature_stats"]
        analysis.class_balance   = result["class_balance"]
        analysis.rewritten_code  = result["rewritten_code"]
        analysis.rewrite_summary = result["rewrite_summary"]
        analysis.diff_lines      = result["diff_lines"]
        analysis.status          = "done"
        db.commit()

        # Create version entry
        existing_versions = db.query(PipelineVersion).filter(
            PipelineVersion.model_id == model_id
        ).count()
        version_tag = f"v{existing_versions + 1}.0"

        # Mark previous versions as not latest
        db.query(PipelineVersion).filter(
            PipelineVersion.model_id == model_id
        ).update({"is_latest": False})

        pv = PipelineVersion(
            analysis_id   = analysis_id,
            model_id      = model_id,
            version_tag   = version_tag,
            commit_hash   = result["commit_hash"],
            commit_msg    = f"Auto-analysis: {len(result['bugs'])} bugs fixed, score {result['overall_score']:.0f}/100",
            author        = username,
            code          = result["rewritten_code"],
            is_latest     = True,
            changes_count = len(result["diff_lines"]),
        )
        db.add(pv)
        db.commit()
        logger.info(f"Analysis {analysis_id} complete — version {version_tag}")

    except Exception as e:
        logger.error(f"Analysis {analysis_id} failed: {e}", exc_info=True)
        try:
            analysis = db.query(PipelineAnalysis).filter(PipelineAnalysis.id == analysis_id).first()
            if analysis:
                analysis.status = "failed"
                analysis.error_message = str(e)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post("/analyze/{model_id}")
def trigger_analysis(
    model_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """
    Trigger a full pipeline analysis on an uploaded model.
    Analysis runs in the background — poll /pipeline/analysis/{id} for status.
    """
    model = _get_model_or_404(model_id, db)

    # Create pending analysis record
    analysis = PipelineAnalysis(
        uploaded_model_id = model_id,
        created_by        = current_user.id,
        status            = "pending"
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Get DB URL for background task
    from database import engine
    db_url = str(engine.url)

    background_tasks.add_task(
        _run_analysis_bg,
        model_id, analysis.id, db_url, current_user.username
    )

    return {
        "analysis_id": analysis.id,
        "model_id":    model_id,
        "status":      "pending",
        "message":     "Analysis started. Poll /pipeline/analysis/{id} for results."
    }


@router.get("/analysis/{analysis_id}")
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Get full analysis result by ID."""
    a = db.query(PipelineAnalysis).filter(PipelineAnalysis.id == analysis_id).first()
    if not a:
        raise HTTPException(404, "Analysis not found.")

    return {
        "id":              a.id,
        "model_id":        a.uploaded_model_id,
        "status":          a.status,
        "error_message":   a.error_message,
        "created_at":      a.created_at.isoformat() if a.created_at else None,
        "overall_score":   a.overall_score,
        "code_quality":    a.code_quality,
        "data_quality":    a.data_quality,
        "model_health":    a.model_health,
        "pipeline_score":  a.pipeline_score,
        "model_type":      a.model_type,
        "hyperparameters": a.hyperparameters,
        "feature_stats":   a.feature_stats,
        "bugs":            a.bugs or [],
        "conflicts":       a.conflicts or [],
        "warnings":        a.warnings or [],
        "suggestions":     a.suggestions or [],
        "rewrite_summary": a.rewrite_summary,
        "diff_lines":      (a.diff_lines or [])[:120],   # cap for response size
    }


@router.get("/analysis/{analysis_id}/code")
def get_rewritten_code(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Get the full rewritten pipeline code."""
    a = db.query(PipelineAnalysis).filter(PipelineAnalysis.id == analysis_id).first()
    if not a:
        raise HTTPException(404, "Analysis not found.")
    if a.status != "done":
        raise HTTPException(400, f"Analysis is not complete yet (status: {a.status}).")
    return {"code": a.rewritten_code, "summary": a.rewrite_summary}


@router.get("/model/{model_id}/analyses")
def list_model_analyses(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """List all analyses for a model (newest first)."""
    _get_model_or_404(model_id, db)
    rows = (
        db.query(PipelineAnalysis)
        .filter(PipelineAnalysis.uploaded_model_id == model_id)
        .order_by(PipelineAnalysis.created_at.desc())
        .all()
    )
    return [
        {
            "id":            r.id,
            "status":        r.status,
            "overall_score": r.overall_score,
            "bugs_count":    len(r.bugs or []),
            "conflicts_count": len(r.conflicts or []),
            "warnings_count":  len(r.warnings or []),
            "created_at":    r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


# ── Version history (GitHub-style) ────────────────────────────────────────────

@router.get("/model/{model_id}/versions")
def list_versions(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """List all pipeline versions for a model — like git log."""
    _get_model_or_404(model_id, db)
    rows = (
        db.query(PipelineVersion)
        .filter(PipelineVersion.model_id == model_id)
        .order_by(PipelineVersion.created_at.desc())
        .all()
    )
    return [
        {
            "id":           r.id,
            "version_tag":  r.version_tag,
            "commit_hash":  r.commit_hash,
            "commit_msg":   r.commit_msg,
            "author":       r.author,
            "created_at":   r.created_at.isoformat() if r.created_at else None,
            "is_latest":    r.is_latest,
            "changes_count":r.changes_count,
            "parent_hash":  r.parent_hash,
        }
        for r in rows
    ]


@router.get("/version/{version_id}/code")
def get_version_code(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Get the pipeline code for a specific version."""
    v = db.query(PipelineVersion).filter(PipelineVersion.id == version_id).first()
    if not v:
        raise HTTPException(404, "Version not found.")
    return {
        "version_tag": v.version_tag,
        "commit_hash": v.commit_hash,
        "commit_msg":  v.commit_msg,
        "author":      v.author,
        "created_at":  v.created_at.isoformat() if v.created_at else None,
        "code":        v.code,
    }


@router.post("/version/{version_id}/tag")
def tag_version(
    version_id: int,
    tag: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Rename/tag a version (admin only)."""
    v = db.query(PipelineVersion).filter(PipelineVersion.id == version_id).first()
    if not v:
        raise HTTPException(404, "Version not found.")
    v.version_tag = tag
    db.commit()
    return {"success": True, "version_tag": tag}


@router.get("/model/{model_id}/latest-code")
def get_latest_code(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Get the latest rewritten pipeline code for a model."""
    v = (
        db.query(PipelineVersion)
        .filter(PipelineVersion.model_id == model_id, PipelineVersion.is_latest == True)
        .first()
    )
    if not v:
        raise HTTPException(404, "No pipeline versions found. Run an analysis first.")
    return {
        "version_tag": v.version_tag,
        "commit_hash": v.commit_hash,
        "commit_msg":  v.commit_msg,
        "author":      v.author,
        "created_at":  v.created_at.isoformat() if v.created_at else None,
        "code":        v.code,
    }


@router.get("/summary")
def pipeline_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    """Dashboard summary — total analyses, avg score, top issues."""
    all_analyses = db.query(PipelineAnalysis).filter(PipelineAnalysis.status == "done").all()
    if not all_analyses:
        return {"total": 0, "avg_score": 0, "top_bugs": [], "models_analyzed": 0}

    scores   = [a.overall_score for a in all_analyses if a.overall_score]
    all_bugs = []
    for a in all_analyses:
        all_bugs.extend(a.bugs or [])

    # Count bug categories
    from collections import Counter
    cat_counts = Counter(b["category"] for b in all_bugs)
    top_bugs   = [{"category": k, "count": v} for k, v in cat_counts.most_common(5)]

    return {
        "total":            len(all_analyses),
        "models_analyzed":  len(set(a.uploaded_model_id for a in all_analyses)),
        "avg_score":        round(sum(scores) / len(scores), 1) if scores else 0,
        "total_bugs_found": len(all_bugs),
        "top_bug_categories": top_bugs,
        "versions_created": db.query(PipelineVersion).count(),
    }
