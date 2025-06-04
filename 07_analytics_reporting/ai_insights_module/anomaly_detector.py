# Detects metric anomalies
def detect_anomalies(metrics):
    return {k: v for k, v in metrics.items() if v > 1.5}
