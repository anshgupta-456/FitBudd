from flask import Blueprint, jsonify, request

from .. import validation as v
from ..errors import ApiError, NotFound
from ..extensions import db
from ..models import Gym, GymAmenity

bp = Blueprint("gyms", __name__)

SORTS = {
    "rating": (Gym.rating.desc(), Gym.review_count.desc()),
    "price": (Gym.price_per_month.asc(),),
    "name": (Gym.name.asc(),),
}


@bp.get("/gyms")
def list_gyms():
    query = db.select(Gym)

    if city := request.args.get("city", "").strip():
        query = query.where(Gym.city.ilike(city))
    if q := request.args.get("q", "").strip():
        like = f"%{q}%"
        query = query.where(db.or_(Gym.name.ilike(like), Gym.area.ilike(like), Gym.address.ilike(like)))
    if max_price := request.args.get("max_price", type=int):
        query = query.where(Gym.price_per_month <= max_price)
    if min_rating := request.args.get("min_rating", type=float):
        query = query.where(Gym.rating >= min_rating)
    for amenity in request.args.getlist("amenity"):
        query = query.where(Gym.amenities.any(GymAmenity.name == amenity))
    if request.args.get("women_only_hours") == "1":
        query = query.where(Gym.women_only_hours.is_not(None))

    sort = request.args.get("sort", "rating")
    if sort not in SORTS:
        raise ApiError("sort must be one of: rating, price, name", 400)
    query = query.order_by(*SORTS[sort])

    gyms = db.session.scalars(query.limit(v.query_int("limit", 50, minimum=1, maximum=100))).all()

    cities = db.session.scalars(db.select(Gym.city).distinct().order_by(Gym.city)).all()
    amenities = db.session.scalars(db.select(GymAmenity.name).distinct().order_by(GymAmenity.name)).all()
    return jsonify({"gyms": [g.to_dict() for g in gyms], "filters": {"cities": cities, "amenities": amenities}})


@bp.get("/gyms/<int:gym_id>")
def get_gym(gym_id: int):
    gym = db.session.get(Gym, gym_id)
    if gym is None:
        raise NotFound("Gym")
    return jsonify({"gym": gym.to_dict()})
