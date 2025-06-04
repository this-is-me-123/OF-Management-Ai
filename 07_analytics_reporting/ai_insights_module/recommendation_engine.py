# Generate strategy suggestions from metrics
def generate_recommendations(metrics):
    if metrics.get('churn_rate', 0) > 0.1:
        return 'Consider re-engagement campaign.'
