from datetime import date, datetime, time, timezone
from datetime import date as Date  # alias: several models have a column called "date"

from sqlalchemy import JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Text

from .extensions import db

# Allowed values, shared with the route validators.
GENDERS = ("female", "male", "other")
LEVELS = ("beginner", "intermediate", "advanced")
GOALS = ("lose_fat", "build_muscle", "get_stronger", "endurance", "mobility", "stay_active")
TIMES_OF_DAY = ("morning", "afternoon", "evening")
DIETS = ("vegetarian", "eggetarian", "non_vegetarian", "vegan")
WORKOUT_KINDS = ("strength", "cardio", "mobility", "sport", "class")
WORKOUT_STATUSES = ("planned", "done", "skipped")
CLASS_CATEGORIES = ("yoga", "pilates", "hiit", "dance", "strength", "aerial")
SPORTS = ("badminton", "pickleball", "tennis", "basketball", "football", "squash")
SESSION_FOCUS = ("strength", "fat_loss", "mobility", "prenatal", "nutrition", "sport")


def utcnow() -> datetime:
    """Naive UTC timestamp; every stored *_at column is UTC."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso_utc(value: datetime | None) -> str | None:
    return value.isoformat(timespec="seconds") + "Z" if value else None


def iso_local(value: datetime | date | time | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, time):
        return value.strftime("%H:%M")
    if isinstance(value, datetime):
        return value.isoformat(timespec="minutes")
    return value.isoformat()


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class User(TimestampMixin, db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    age: Mapped[int | None]
    gender: Mapped[str | None] = mapped_column(String(10))
    height_cm: Mapped[float | None]
    weight_kg: Mapped[float | None]
    fitness_level: Mapped[str] = mapped_column(String(20), default="beginner")
    city: Mapped[str | None] = mapped_column(String(80))
    bio: Mapped[str | None] = mapped_column(Text)
    goals: Mapped[list] = mapped_column(JSON, default=list)
    preferred_time: Mapped[str | None] = mapped_column(String(20))
    diet: Mapped[str | None] = mapped_column(String(20))
    last_active_at: Mapped[datetime] = mapped_column(default=utcnow)

    def public_dict(self) -> dict:
        """What other members can see."""
        return {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "fitness_level": self.fitness_level,
            "city": self.city,
            "bio": self.bio,
            "goals": self.goals or [],
            "preferred_time": self.preferred_time,
            "last_active_at": iso_utc(self.last_active_at),
        }

    def private_dict(self) -> dict:
        """What the signed-in member sees about themselves."""
        return {
            **self.public_dict(),
            "email": self.email,
            "height_cm": self.height_cm,
            "weight_kg": self.weight_kg,
            "diet": self.diet,
            "created_at": iso_utc(self.created_at),
        }


class Workout(TimestampMixin, db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    kind: Mapped[str] = mapped_column(String(20))
    date: Mapped[Date] = mapped_column(index=True)
    start_time: Mapped[time | None]
    duration_min: Mapped[int]
    location: Mapped[str | None] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(10), default="planned")
    effort: Mapped[int | None]  # 1-10 rating of perceived effort, set when logged as done
    partner_id: Mapped[int | None] = mapped_column(ForeignKey("user.id", ondelete="SET NULL"))
    completed_at: Mapped[datetime | None]
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)

    partner: Mapped["User | None"] = relationship(foreign_keys=[partner_id])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "kind": self.kind,
            "date": iso_local(self.date),
            "start_time": iso_local(self.start_time),
            "duration_min": self.duration_min,
            "location": self.location,
            "notes": self.notes,
            "status": self.status,
            "effort": self.effort,
            "partner": {"id": self.partner.id, "name": self.partner.name} if self.partner else None,
            "completed_at": iso_utc(self.completed_at),
        }


class Measurement(TimestampMixin, db.Model):
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_measurement_day"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
    date: Mapped[Date]
    weight_kg: Mapped[float | None]
    body_fat_pct: Mapped[float | None]
    waist_cm: Mapped[float | None]
    resting_hr: Mapped[int | None]
    notes: Mapped[str | None] = mapped_column(String(200))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "date": iso_local(self.date),
            "weight_kg": self.weight_kg,
            "body_fat_pct": self.body_fat_pct,
            "waist_cm": self.waist_cm,
            "resting_hr": self.resting_hr,
            "notes": self.notes,
        }


class Gym(TimestampMixin, db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    area: Mapped[str] = mapped_column(String(80))
    city: Mapped[str] = mapped_column(String(80), index=True)
    address: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    rating: Mapped[float] = mapped_column(default=0)
    review_count: Mapped[int] = mapped_column(default=0)
    price_per_month: Mapped[int]
    day_pass: Mapped[int | None]
    phone: Mapped[str | None] = mapped_column(String(30))
    website: Mapped[str | None] = mapped_column(String(200))
    weekday_hours: Mapped[str] = mapped_column(String(30))
    weekend_hours: Mapped[str] = mapped_column(String(30))
    women_only_hours: Mapped[str | None] = mapped_column(String(60))
    equipment: Mapped[list] = mapped_column(JSON, default=list)
    classes: Mapped[list] = mapped_column(JSON, default=list)

    amenities: Mapped[list["GymAmenity"]] = relationship(
        back_populates="gym", cascade="all, delete-orphan", lazy="selectin"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "area": self.area,
            "city": self.city,
            "address": self.address,
            "description": self.description,
            "rating": self.rating,
            "review_count": self.review_count,
            "price_per_month": self.price_per_month,
            "day_pass": self.day_pass,
            "phone": self.phone,
            "website": self.website,
            "hours": {"weekdays": self.weekday_hours, "weekends": self.weekend_hours},
            "women_only_hours": self.women_only_hours,
            "amenities": sorted(a.name for a in self.amenities),
            "equipment": self.equipment or [],
            "classes": self.classes or [],
        }


class GymAmenity(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    gym_id: Mapped[int] = mapped_column(ForeignKey("gym.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(40), index=True)

    gym: Mapped[Gym] = relationship(back_populates="amenities")


class StudioClass(TimestampMixin, db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(20), index=True)
    instructor: Mapped[str] = mapped_column(String(80))
    studio: Mapped[str] = mapped_column(String(120))
    city: Mapped[str] = mapped_column(String(80), index=True)
    starts_at: Mapped[datetime] = mapped_column(index=True)  # local studio time
    duration_min: Mapped[int]
    level: Mapped[str] = mapped_column(String(20), default="all")
    capacity: Mapped[int]
    price: Mapped[int]
    description: Mapped[str | None] = mapped_column(Text)

    bookings: Mapped[list["ClassBooking"]] = relationship(back_populates="studio_class", lazy="selectin")

    @property
    def booked(self) -> int:
        return sum(1 for b in self.bookings if b.status == "confirmed")

    def to_dict(self, user_id: int | None = None) -> dict:
        booked = self.booked
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "instructor": self.instructor,
            "studio": self.studio,
            "city": self.city,
            "starts_at": iso_local(self.starts_at),
            "duration_min": self.duration_min,
            "level": self.level,
            "capacity": self.capacity,
            "spots_left": max(self.capacity - booked, 0),
            "price": self.price,
            "description": self.description,
            "booked_by_me": bool(
                user_id
                and any(b.user_id == user_id and b.status == "confirmed" for b in self.bookings)
            ),
        }


class ClassBooking(TimestampMixin, db.Model):
    __table_args__ = (UniqueConstraint("user_id", "class_id", name="uq_class_booking"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("studio_class.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(12), default="confirmed")

    studio_class: Mapped[StudioClass] = relationship(back_populates="bookings")


class CourtSlot(TimestampMixin, db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    sport: Mapped[str] = mapped_column(String(20), index=True)
    venue: Mapped[str] = mapped_column(String(120))
    court: Mapped[str] = mapped_column(String(40))
    city: Mapped[str] = mapped_column(String(80), index=True)
    starts_at: Mapped[datetime] = mapped_column(index=True)  # local venue time
    duration_min: Mapped[int] = mapped_column(default=60)
    price: Mapped[int]
    floodlit: Mapped[bool] = mapped_column(default=False)
    rackets_included: Mapped[bool] = mapped_column(default=False)
    booked_by_id: Mapped[int | None] = mapped_column(ForeignKey("user.id", ondelete="SET NULL"), index=True)
    booked_at: Mapped[datetime | None]

    def to_dict(self, user_id: int | None = None) -> dict:
        return {
            "id": self.id,
            "sport": self.sport,
            "venue": self.venue,
            "court": self.court,
            "city": self.city,
            "starts_at": iso_local(self.starts_at),
            "duration_min": self.duration_min,
            "price": self.price,
            "floodlit": self.floodlit,
            "rackets_included": self.rackets_included,
            "available": self.booked_by_id is None,
            "booked_by_me": bool(user_id and self.booked_by_id == user_id),
        }


class Trainer(TimestampMixin, db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    gender: Mapped[str] = mapped_column(String(10))
    headline: Mapped[str] = mapped_column(String(160))
    specialties: Mapped[list] = mapped_column(JSON, default=list)
    certifications: Mapped[list] = mapped_column(JSON, default=list)
    languages: Mapped[list] = mapped_column(JSON, default=list)
    experience_years: Mapped[int]
    bio: Mapped[str] = mapped_column(Text)
    city: Mapped[str] = mapped_column(String(80), index=True)
    areas: Mapped[str | None] = mapped_column(String(200))
    rating: Mapped[float] = mapped_column(default=0)
    review_count: Mapped[int] = mapped_column(default=0)
    hourly_rate: Mapped[int]
    women_clients_focus: Mapped[bool] = mapped_column(default=False)
    accepting_clients: Mapped[bool] = mapped_column(default=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "gender": self.gender,
            "headline": self.headline,
            "specialties": self.specialties or [],
            "certifications": self.certifications or [],
            "languages": self.languages or [],
            "experience_years": self.experience_years,
            "bio": self.bio,
            "city": self.city,
            "areas": self.areas,
            "rating": self.rating,
            "review_count": self.review_count,
            "hourly_rate": self.hourly_rate,
            "women_clients_focus": self.women_clients_focus,
            "accepting_clients": self.accepting_clients,
        }


class TrainerSession(TimestampMixin, db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
    trainer_id: Mapped[int] = mapped_column(ForeignKey("trainer.id", ondelete="CASCADE"), index=True)
    date: Mapped[Date]
    start_time: Mapped[time]
    duration_min: Mapped[int]
    address: Mapped[str] = mapped_column(String(200))
    focus: Mapped[str] = mapped_column(String(20))
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(12), default="requested")
    price: Mapped[int]

    trainer: Mapped[Trainer] = relationship(lazy="joined")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "trainer": {"id": self.trainer.id, "name": self.trainer.name, "city": self.trainer.city},
            "date": iso_local(self.date),
            "start_time": iso_local(self.start_time),
            "duration_min": self.duration_min,
            "address": self.address,
            "focus": self.focus,
            "notes": self.notes,
            "status": self.status,
            "price": self.price,
        }


class DietPlan(TimestampMixin, db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    goal: Mapped[str] = mapped_column(String(20), index=True)
    diet: Mapped[str] = mapped_column(String(20), index=True)
    for_women: Mapped[bool] = mapped_column(default=False)
    daily_calories: Mapped[int]
    protein_g: Mapped[int]
    summary: Mapped[str] = mapped_column(Text)
    meals: Mapped[list] = mapped_column(JSON, default=list)
    author: Mapped[str | None] = mapped_column(String(80))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "goal": self.goal,
            "diet": self.diet,
            "for_women": self.for_women,
            "daily_calories": self.daily_calories,
            "protein_g": self.protein_g,
            "summary": self.summary,
            "meals": self.meals or [],
            "author": self.author,
        }


class Connection(TimestampMixin, db.Model):
    """A partner request from one member to another. Accepted means they are partners."""

    __table_args__ = (UniqueConstraint("requester_id", "addressee_id", name="uq_connection_pair"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    requester_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
    addressee_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(10), default="pending")
    note: Mapped[str | None] = mapped_column(String(280))
    responded_at: Mapped[datetime | None]

    requester: Mapped[User] = relationship(foreign_keys=[requester_id], lazy="joined")
    addressee: Mapped[User] = relationship(foreign_keys=[addressee_id], lazy="joined")

    def other(self, user_id: int) -> User:
        return self.addressee if self.requester_id == user_id else self.requester


class Message(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
    recipient_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
    body: Mapped[str] = mapped_column(Text)
    sent_at: Mapped[datetime] = mapped_column(default=utcnow, index=True)
    read_at: Mapped[datetime | None]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "recipient_id": self.recipient_id,
            "body": self.body,
            "sent_at": iso_utc(self.sent_at),
            "read_at": iso_utc(self.read_at),
        }
