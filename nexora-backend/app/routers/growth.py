import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from .. import models as m, schemas
from ..deps import Ctx, get_ctx
from ..services import campaign_views, get_or_create_segment

router = APIRouter(prefix="/campaigns", tags=["Growth"])


def _load(ctx: Ctx, cid=None) -> list[m.Campaign]:
    q = (select(m.Campaign).where(m.Campaign.store_id == ctx.store_id)
         .options(selectinload(m.Campaign.segment), selectinload(m.Campaign.variants))
         .order_by(m.Campaign.created_at.desc()))
    if cid:
        q = q.where(m.Campaign.id == cid)
    return list(ctx.db.scalars(q))


def _one(ctx: Ctx, cid: uuid.UUID) -> m.Campaign:
    found = _load(ctx, cid)
    if not found:
        raise HTTPException(404, "Campaign not found")
    return found[0]


@router.get("", response_model=list[schemas.CampaignOut])
def list_campaigns(ctx: Ctx = Depends(get_ctx)):
    return campaign_views(ctx.db, _load(ctx))


@router.post("", response_model=schemas.CampaignOut, status_code=201)
def create_campaign(body: schemas.CampaignIn, ctx: Ctx = Depends(get_ctx)):
    seg = get_or_create_segment(ctx, body.audience_tag) if body.audience_tag else None
    camp = m.Campaign(tenant_id=ctx.tenant_id, store_id=ctx.store_id, segment_id=seg.id if seg else None,
                      channel=body.channel, status="draft", name=body.name)
    ctx.db.add(camp)
    ctx.db.flush()
    ctx.db.add(m.CampaignVariant(tenant_id=ctx.tenant_id, campaign_id=camp.id, label="A", content=body.message))
    ctx.db.commit()
    return campaign_views(ctx.db, _load(ctx, camp.id))[0]


@router.patch("/{cid}/status", response_model=schemas.CampaignOut)
def set_status(cid: uuid.UUID, body: schemas.CampaignStatusIn, ctx: Ctx = Depends(get_ctx)):
    camp = _one(ctx, cid)
    camp.status = body.status
    variant = camp.variants[0] if camp.variants else None
    if body.status == "running" and variant:
        already = ctx.db.scalar(select(func.count()).select_from(m.CampaignDelivery)
                                .join(m.CampaignVariant, m.CampaignVariant.id == m.CampaignDelivery.variant_id)
                                .where(m.CampaignVariant.campaign_id == camp.id))
        if not already:  # placeholder: record deliveries; real sending plugs in here later
            q = select(m.Customer.id).where(m.Customer.store_id == ctx.store_id)
            if camp.segment_id:
                q = q.where(m.Customer.id.in_(select(m.SegmentMember.customer_id)
                                              .where(m.SegmentMember.segment_id == camp.segment_id)))
            for (customer_id,) in ctx.db.execute(q):
                ctx.db.add(m.CampaignDelivery(tenant_id=ctx.tenant_id, variant_id=variant.id,
                                              customer_id=customer_id, status="sent"))
    ctx.db.commit()
    return campaign_views(ctx.db, _load(ctx, cid))[0]


@router.delete("/{cid}", status_code=204)
def delete_campaign(cid: uuid.UUID, ctx: Ctx = Depends(get_ctx)):
    ctx.db.delete(_one(ctx, cid))   # variants + deliveries removed by ON DELETE CASCADE
    ctx.db.commit()
