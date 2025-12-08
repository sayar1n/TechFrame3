from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from typing import Any


class HealthResponse(BaseModel):
    status: str
    now: datetime


class IssLastResponse(BaseModel):
    id: Optional[int] = None
    fetched_at: Optional[datetime] = None
    source_url: Optional[str] = None
    payload: Optional[dict[str, Any]] = None
    message: Optional[str] = None


class IssTrendResponse(BaseModel):
    movement: bool
    delta_km: float
    dt_sec: float
    velocity_kmh: Optional[float] = None
    from_time: Optional[datetime] = None
    to_time: Optional[datetime] = None
    from_lat: Optional[float] = None
    from_lon: Optional[float] = None
    to_lat: Optional[float] = None
    to_lon: Optional[float] = None


class OsdrSyncResponse(BaseModel):
    written: int


class OsdrItem(BaseModel):
    id: int
    dataset_id: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    rest_url: Optional[str] = None
    updated_at: Optional[datetime] = None
    inserted_at: datetime
    raw: dict[str, Any]


class OsdrListResponse(BaseModel):
    items: list[OsdrItem]


class SpaceLatestResponse(BaseModel):
    source: str
    fetched_at: Optional[datetime] = None
    payload: Optional[dict[str, Any]] = None
    message: Optional[str] = None


class SpaceRefreshResponse(BaseModel):
    refreshed: list[str]


class SpaceSummaryResponse(BaseModel):
    apod: dict[str, Any]
    neo: dict[str, Any]
    flr: dict[str, Any]
    cme: dict[str, Any]
    spacex: dict[str, Any]
    iss: dict[str, Any]
    osdr_count: int

