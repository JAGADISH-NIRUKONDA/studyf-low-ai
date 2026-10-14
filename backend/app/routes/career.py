from flask import Blueprint, request
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id
from app.services.career_service import CareerService
from app.utils.helpers import api_response, api_error, auth_required

career_bp = Blueprint("career", __name__)

@career_bp.route("/profile", methods=["GET"])
@auth_required()
def get_career_profile(user_oid):
    profile = mongo.career_profiles.find_one({"user_id": user_oid})
    if not profile:
        profile = {
            "user_id": user_oid,
            "academic_interests": [],
            "technical_skills": [],
            "career_goal": ""
        }
    return api_response(data={"profile": serialize_doc(profile)})

@career_bp.route("/recommend", methods=["POST"])
@auth_required()
def recommend_career(user_oid):
    data = request.get_json() or {}
    academic_interests = data.get("academic_interests") or []
    technical_skills = data.get("technical_skills") or []
    career_goal = data.get("career_goal") or ""

    recommendations = CareerService.analyze_profile_and_recommend(
        user_id=user_oid,
        academic_interests=academic_interests,
        technical_skills=technical_skills,
        career_goal=career_goal
    )
    return api_response(
        message="Generated personalized career recommendations and learning roadmaps.",
        data={"recommendations": recommendations}
    )

@career_bp.route("/recommendations", methods=["GET"])
@auth_required()
def get_saved_recommendations(user_oid):
    recs = list(mongo.career_recommendations.find({"user_id": user_oid}).sort("match_percentage", -1))
    return api_response(data={"recommendations": serialize_doc(recs)})

