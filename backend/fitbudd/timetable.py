"""Recurring weekly timetable for partner studios and courts.

Studios publish a fixed weekly schedule, so instead of storing months of rows we
keep the next couple of weeks generated from these templates and top them up
whenever someone opens the timetable.
"""

import random
import threading
from datetime import date, datetime, time, timedelta

from .clock import local_today
from .extensions import db
from .models import ClassBooking, CourtSlot, StudioClass, User

MON, TUE, WED, THU, FRI, SAT, SUN = range(7)
WEEKDAYS = (MON, TUE, WED, THU, FRI)
EVERY_DAY = tuple(range(7))

# (title, category, instructor, studio, city, start, minutes, level, capacity, price, days, description)
CLASSES = [
    # Bengaluru
    ("Morning Hatha", "yoga", "Lakshmi Rao", "Prana Studio, Indiranagar", "Bengaluru", "06:30", 60, "all", 18, 450, WEEKDAYS,
     "Slow, alignment-focused hatha. Bring a mat if you have one; the studio has spares."),
    ("Vinyasa Flow", "yoga", "Arjun Menon", "Prana Studio, Indiranagar", "Bengaluru", "18:30", 60, "intermediate", 16, 500, (MON, WED, FRI),
     "Breath-led sequences with sun salutations and standing balances."),
    ("Reformer Pilates", "pilates", "Neha Kulkarni", "CoreLab, Koramangala", "Bengaluru", "07:30", 50, "beginner", 8, 1200, (TUE, THU, SAT),
     "Small-group reformer class. Grip socks required."),
    ("Mat Pilates", "pilates", "Neha Kulkarni", "CoreLab, Koramangala", "Bengaluru", "19:00", 45, "all", 14, 600, (MON, WED),
     "Core, hip and posture work on the mat."),
    ("Engine Room HIIT", "hiit", "Rohit Shetty", "The Pit, HSR Layout", "Bengaluru", "06:00", 45, "intermediate", 20, 400, (MON, WED, FRI),
     "Intervals on bikes, rowers and kettlebells. Expect to sweat."),
    ("Barbell Basics", "strength", "Kavya Iyer", "The Pit, HSR Layout", "Bengaluru", "18:00", 60, "beginner", 10, 550, (TUE, THU),
     "Learn the squat, bench, deadlift and press with a coach watching every rep."),
    ("Bollywood Dance Cardio", "dance", "Sanjana D'Souza", "Studio Move, Jayanagar", "Bengaluru", "19:30", 50, "all", 25, 350, (TUE, THU, SAT),
     "High-energy choreography to current Bollywood tracks. No dance experience needed."),
    ("Aerial Hammock Intro", "aerial", "Meera Pillai", "Studio Move, Jayanagar", "Bengaluru", "10:00", 60, "beginner", 8, 1100, (SAT, SUN),
     "Inversions and supported stretches in a silk hammock. Wear fitted clothes."),
    # Mumbai
    ("Sunrise Ashtanga", "yoga", "Vikram Desai", "Shanti Yoga Shala, Bandra West", "Mumbai", "06:15", 75, "intermediate", 20, 500, WEEKDAYS,
     "Led primary series. Some yoga experience recommended."),
    ("Yin & Breathwork", "yoga", "Aisha Khan", "Shanti Yoga Shala, Bandra West", "Mumbai", "20:00", 60, "all", 20, 450, (TUE, THU, SUN),
     "Long-held floor poses and pranayama to wind down the day."),
    ("Reformer Sculpt", "pilates", "Tanya Mehta", "Align Studio, Lower Parel", "Mumbai", "08:00", 50, "intermediate", 8, 1400, (MON, WED, FRI, SAT),
     "Faster-paced reformer class with springs set heavy."),
    ("Tabata Express", "hiit", "Karan Malhotra", "Grind Box, Andheri West", "Mumbai", "07:00", 30, "all", 24, 300, WEEKDAYS,
     "Eight rounds, twenty seconds on, ten off. Done before your coffee gets cold."),
    ("Strength Club", "strength", "Pooja Naik", "Grind Box, Andheri West", "Mumbai", "18:30", 60, "intermediate", 12, 600, (MON, WED, FRI),
     "Programmed strength cycles. Bring a log book or use the app."),
    ("Zumba", "dance", "Rhea Fernandes", "Grind Box, Andheri West", "Mumbai", "19:45", 50, "all", 30, 300, (TUE, THU, SAT),
     "Latin rhythms and simple steps. Great first class."),
    # Delhi
    ("Iyengar Yoga", "yoga", "Sunita Bhalla", "Sadhana Yoga, Hauz Khas", "Delhi", "07:00", 75, "all", 16, 500, (MON, WED, FRI, SAT),
     "Precise alignment with blocks, straps and wall ropes."),
    ("Power Yoga", "yoga", "Aman Kapoor", "Sadhana Yoga, Hauz Khas", "Delhi", "18:00", 60, "intermediate", 18, 450, (TUE, THU),
     "Strong, sweaty flow with arm balances."),
    ("Postnatal Pilates", "pilates", "Ritu Sharma", "Balance Studio, Greater Kailash", "Delhi", "11:00", 45, "beginner", 8, 900, (TUE, THU),
     "Gentle core and pelvic floor rebuilding for new mothers. Babies welcome."),
    ("Metcon 45", "hiit", "Siddharth Rana", "Iron Yard, Saket", "Delhi", "06:30", 45, "advanced", 16, 450, (MON, WED, FRI),
     "Metabolic conditioning with barbells and sleds. Scaled options given."),
    ("Women's Strength", "strength", "Harleen Kaur", "Iron Yard, Saket", "Delhi", "10:00", 60, "beginner", 10, 550, (SAT, SUN),
     "Women-only lifting class with a female coach."),
    ("Bhangra Fit", "dance", "Gurpreet Singh", "Balance Studio, Greater Kailash", "Delhi", "19:00", 50, "all", 25, 350, (MON, WED, FRI),
     "Punjabi folk dance moves turned into a full-body workout."),
]

# (sport, venue, city, courts, price per hour, floodlit, rackets included)
VENUES = [
    ("badminton", "Smash Arena, Whitefield", "Bengaluru", ("Court 1", "Court 2", "Court 3"), 500, False, True),
    ("pickleball", "Dink House, Koramangala", "Bengaluru", ("Court A", "Court B"), 600, True, True),
    ("football", "Kick Off Turf, Bellandur", "Bengaluru", ("5-a-side",), 1800, True, False),
    ("badminton", "Shuttle Hub, Powai", "Mumbai", ("Court 1", "Court 2"), 550, False, True),
    ("tennis", "Juhu Tennis Club", "Mumbai", ("Hard Court 1", "Clay Court"), 900, True, False),
    ("squash", "Racquet Room, Worli", "Mumbai", ("Glass Court",), 700, False, True),
    ("pickleball", "Paddle Point, Vasant Kunj", "Delhi", ("Court 1", "Court 2"), 550, True, True),
    ("basketball", "Hoops Arena, Dwarka", "Delhi", ("Full Court",), 1200, True, False),
    ("badminton", "Siri Fort Sports Complex", "Delhi", ("Court 4", "Court 5"), 400, False, False),
]

COURT_HOURS = (6, 7, 8, 17, 18, 19, 20, 21)

_lock = threading.Lock()


def _hhmm(value: str) -> time:
    hours, minutes = value.split(":")
    return time(int(hours), int(minutes))


def _fill_day(day: date, members: list[int]) -> None:
    # Seeded per day so the same "already booked" pattern comes back after a restart.
    rng = random.Random(day.toordinal())
    weekday = day.weekday()

    for (title, category, instructor, studio, city, start, minutes, level, capacity, price, days, description) in CLASSES:
        if weekday not in days:
            continue
        studio_class = StudioClass(
            title=title, category=category, instructor=instructor, studio=studio, city=city,
            starts_at=datetime.combine(day, _hhmm(start)), duration_min=minutes, level=level,
            capacity=capacity, price=price, description=description,
        )
        if members:
            taken = rng.randint(0, max(capacity - 2, 0))
            studio_class.bookings = [
                ClassBooking(user_id=user_id, status="confirmed")
                for user_id in rng.sample(members, min(taken, len(members)))
            ]
        db.session.add(studio_class)

    for sport, venue, city, courts, price, floodlit, rackets in VENUES:
        for court in courts:
            for hour in COURT_HOURS:
                taken = members and rng.random() < (0.45 if hour >= 18 else 0.25)
                db.session.add(CourtSlot(
                    sport=sport, venue=venue, court=court, city=city,
                    starts_at=datetime.combine(day, time(hour)), duration_min=60,
                    price=price + (150 if floodlit and hour >= 18 else 0),
                    floodlit=floodlit and hour >= 18, rackets_included=rackets,
                    booked_by_id=rng.choice(members) if taken else None,
                ))


def ensure_timetable(days: int) -> int:
    """Generate any missing days between today and today + days. Returns how many days were added."""
    today = local_today()
    horizon = today + timedelta(days=days)
    with _lock:
        latest = db.session.scalar(db.select(db.func.max(StudioClass.starts_at)))
        if latest is not None and latest.date() >= horizon - timedelta(days=1):
            return 0

        existing = {
            row.date() if isinstance(row, datetime) else datetime.fromisoformat(str(row)).date()
            for row in db.session.scalars(
                db.select(StudioClass.starts_at).where(StudioClass.starts_at >= datetime.combine(today, time()))
            )
        }
        # Demo members fill some spots so the timetable looks like a real week.
        members = list(db.session.scalars(db.select(User.id).where(User.email.like("%@members.fitbudd.app"))))

        added = 0
        day = today
        while day < horizon:
            if day not in existing:
                _fill_day(day, members)
                added += 1
            day += timedelta(days=1)
        db.session.commit()
        return added
