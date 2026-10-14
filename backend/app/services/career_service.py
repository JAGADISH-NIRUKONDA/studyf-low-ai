from datetime import datetime
from bson import ObjectId
from app.database import mongo, serialize_doc, to_object_id

CAREER_KNOWLEDGE_BASE = {
    "Full Stack Web Developer": {
        "required_skills": ["JavaScript", "React.js", "Node.js", "Python", "SQL", "MongoDB", "Git", "REST APIs", "Docker"],
        "summary": "Full Stack Developers architect end-to-end web applications, designing interactive client interfaces, robust backend APIs, and scalable databases.",
        "roadmap": [
            {"phase": "Foundation", "goal": "Master modern JavaScript (ES6+), DOM manipulation, and asynchronous programming.", "duration": "3-4 weeks"},
            {"phase": "Frontend Specialization", "goal": "Build dynamic, responsive single page applications using React, Vite, and Tailwind CSS.", "duration": "4-6 weeks"},
            {"phase": "Backend & APIs", "goal": "Develop production-ready REST APIs using Python Flask / Express, JWT authentication, and MongoDB.", "duration": "4-5 weeks"},
            {"phase": "DevOps & Deployment", "goal": "Containerize apps with Docker, implement CI/CD workflows, and deploy to cloud platforms.", "duration": "3-4 weeks"}
        ],
        "projects": [
            {"title": "Real-time Collaborative Task & Study Board", "description": "Full-stack kanban workspace with JWT auth, WebSocket updates, and MongoDB persistence."},
            {"title": "E-Commerce or SaaS Dashboard", "description": "Interactive analytics dashboard with charts, pagination, search filters, and checkout integration."}
        ],
        "certifications": [
            {"name": "Meta Front-End & Back-End Professional Certificate", "platform": "Coursera"},
            {"name": "AWS Certified Cloud Practitioner", "platform": "Amazon Web Services"}
        ],
        "resume_tips": [
            "Highlight full-stack projects with live production URLs and GitHub repositories.",
            "Quantify performance impacts (e.g., 'reduced API query latency by 40% with database indexing').",
            "Detail hands-on experience with modern state management, auth, and REST/GraphQL architectures."
        ]
    },
    "AI & Machine Learning Engineer": {
        "required_skills": ["Python", "NumPy", "Pandas", "Scikit-Learn", "PyTorch", "TensorFlow", "Math & Statistics", "SQL", "MLOps"],
        "summary": "AI Engineers design, train, and deploy predictive models, deep learning architectures, and generative AI pipelines into real-world applications.",
        "roadmap": [
            {"phase": "Mathematics & Core Python", "goal": "Master Linear Algebra, Multivariable Calculus, Probability, and high-performance NumPy.", "duration": "4-5 weeks"},
            {"phase": "Classical Machine Learning", "goal": "Implement regression, classification, clustering, cross-validation, and feature engineering with Scikit-Learn.", "duration": "4-6 weeks"},
            {"phase": "Deep Learning & Neural Networks", "goal": "Construct CNNs, RNNs, and Transformers using PyTorch or TensorFlow for computer vision and NLP.", "duration": "6-8 weeks"},
            {"phase": "MLOps & LLM Engineering", "goal": "Deploy models via FastAPI/Flask, implement model tracking with MLflow, and work with LLM APIs / RAG pipelines.", "duration": "4 weeks"}
        ],
        "projects": [
            {"title": "Intelligent Study & Exam Recommender", "description": "Supervised model forecasting student exam readiness and generating tailored revision paths."},
            {"title": "Academic Question Answering with Retrieval-Augmented Generation (RAG)", "description": "Vector search engine indexing PDF textbooks with embeddings for instant question answering."}
        ],
        "certifications": [
            {"name": "DeepLearning.AI Machine Learning Specialization", "platform": "Coursera"},
            {"name": "TensorFlow Developer Certificate", "platform": "Google / DeepLearning.AI"}
        ],
        "resume_tips": [
            "Detail specific model evaluation metrics achieved (e.g., 'achieved 92.4% F1-score on benchmark data').",
            "Showcase end-to-end model deployment rather than just Jupyter notebooks.",
            "Include your Hugging Face or GitHub links with well-documented READMEs."
        ]
    },
    "Data Scientist": {
        "required_skills": ["Python", "SQL", "Pandas", "Data Visualization", "Statistics", "Machine Learning", "Tableau/Power BI", "Data Wrangling"],
        "summary": "Data Scientists uncover actionable business and scientific insights by wrangling messy datasets, running hypothesis tests, and building analytical models.",
        "roadmap": [
            {"phase": "Data Manipulation & SQL", "goal": "Master complex SQL window functions, joins, and Pandas data wrangling pipelines.", "duration": "3-4 weeks"},
            {"phase": "Exploratory Data Analysis & Viz", "goal": "Create compelling visualizations and statistical storyboards using Matplotlib, Seaborn, and Power BI.", "duration": "3-4 weeks"},
            {"phase": "Statistical Modeling & A/B Testing", "goal": "Design hypothesis tests, confidence intervals, and multivariate regression models.", "duration": "4-5 weeks"},
            {"phase": "Predictive Modeling", "goal": "Train ensemble models (Random Forests, XGBoost) and communicate insights to stakeholders.", "duration": "4-6 weeks"}
        ],
        "projects": [
            {"title": "Student Performance & Retention Analytics", "description": "Comprehensive exploratory analysis and churn prediction model on academic datasets."},
            {"title": "Market Trends & Pricing Optimization", "description": "Web scraping and time-series forecasting model evaluating seasonal demand."}
        ],
        "certifications": [
            {"name": "Google Advanced Data Analytics Professional Certificate", "platform": "Coursera"},
            {"name": "IBM Data Science Professional Certificate", "platform": "Coursera"}
        ],
        "resume_tips": [
            "Emphasize business impact and data-driven decisions derived from your analyses.",
            "Link interactive Tableau Public or Streamlit dashboards in your portfolio.",
            "Highlight expertise in statistical rigor and handling dirty or missing data."
        ]
    },
    "Cloud & DevOps Engineer": {
        "required_skills": ["Linux", "Docker", "Kubernetes", "AWS/Azure/GCP", "CI/CD", "Terraform", "Python/Bash", "Networking", "Monitoring"],
        "summary": "Cloud & DevOps Engineers build and maintain resilient cloud infrastructure, automated delivery pipelines, and robust monitoring systems.",
        "roadmap": [
            {"phase": "Linux & Scripting", "goal": "Master Linux command line, system administration, and automation scripting in Bash and Python.", "duration": "3-4 weeks"},
            {"phase": "Containers & Orchestration", "goal": "Package microservices with Docker and orchestrate clusters with Kubernetes.", "duration": "5-6 weeks"},
            {"phase": "Cloud Services & IaC", "goal": "Provision AWS/GCP cloud resources declaratively using Terraform.", "duration": "4-5 weeks"},
            {"phase": "CI/CD & Observability", "goal": "Build GitHub Actions pipelines and set up Prometheus and Grafana monitoring.", "duration": "3-4 weeks"}
        ],
        "projects": [
            {"title": "Automated Multi-Environment CI/CD Pipeline", "description": "GitHub Actions workflow building Docker images, running tests, and deploying to cloud clusters."},
            {"title": "Infrastructure-as-Code Cloud Architecture", "description": "Modular Terraform repo provisioning VPC, subnets, load balancer, and secure database instances."}
        ],
        "certifications": [
            {"name": "AWS Certified Solutions Architect – Associate", "platform": "Amazon Web Services"},
            {"name": "Certified Kubernetes Administrator (CKA)", "platform": "Linux Foundation"}
        ],
        "resume_tips": [
            "Highlight uptime improvements, build time reductions, or automation savings.",
            "Demonstrate experience with security best practices and least-privilege IAM policies.",
            "Include architecture diagrams in your project repositories."
        ]
    }
}

class CareerService:
    @classmethod
    def analyze_profile_and_recommend(cls, user_id, academic_interests=None, technical_skills=None, career_goal=None):
        if technical_skills is None:
            technical_skills = []
        if academic_interests is None:
            academic_interests = []

        # Standardize user skills
        user_skills_normalized = {s.get("skill", "").strip().lower(): s.get("level", "Beginner") for s in technical_skills if isinstance(s, dict) and s.get("skill")}
        user_skills_set = set(user_skills_normalized.keys())

        recommendations = []

        for role_name, data in CAREER_KNOWLEDGE_BASE.items():
            req_skills = data["required_skills"]
            matched_skills = []
            missing_skills = []

            for r_skill in req_skills:
                r_lower = r_skill.lower()
                if any(r_lower in u_skill or u_skill in r_lower for u_skill in user_skills_set):
                    level = next((user_skills_normalized[u] for u in user_skills_set if r_lower in u or u in r_lower), "Intermediate")
                    matched_skills.append({"skill": r_skill, "user_level": level})
                else:
                    missing_skills.append(r_skill)

            match_pct = round((len(matched_skills) / len(req_skills)) * 100) if req_skills else 50
            if career_goal and role_name.lower() in career_goal.lower():
                match_pct = min(100, match_pct + 15)

            recommendation_doc = {
                "user_id": user_id,
                "role_title": role_name,
                "match_percentage": match_pct,
                "summary": data["summary"],
                "required_skills": req_skills,
                "matched_skills": matched_skills,
                "skill_gaps": missing_skills,
                "learning_roadmap": data["roadmap"],
                "suggested_projects": data["projects"],
                "certifications": data["certifications"],
                "resume_tips": data["resume_tips"],
                "created_at": datetime.utcnow()
            }
            recommendations.append(recommendation_doc)

        recommendations.sort(key=lambda x: x["match_percentage"], reverse=True)

        # Persist career profile
        mongo.career_profiles.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "user_id": user_id,
                    "academic_interests": academic_interests,
                    "technical_skills": technical_skills,
                    "career_goal": career_goal,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )

        # Clear and save new recommendations
        mongo.career_recommendations.delete_many({"user_id": user_id})
        if recommendations:
            mongo.career_recommendations.insert_many(recommendations)

        return serialize_doc(recommendations)

