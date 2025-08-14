"""
data_pipeline.py

ETL pipeline for processing OnlyFans and CRM data
"""
import sqlite3
import pandas as pd
import json
import csv
from datetime import datetime, timedelta
import logging
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OFEMDataPipeline:
    def __init__(self, db_path="../crm.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.setup_analytics_tables()
    
    def setup_analytics_tables(self):
        """Initialize analytics-specific tables"""
        cursor = self.conn.cursor()
        
        # Daily aggregated metrics
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_analytics (
                date DATE PRIMARY KEY,
                new_subscribers INTEGER DEFAULT 0,
                total_subscribers INTEGER DEFAULT 0,
                churned_subscribers INTEGER DEFAULT 0,
                total_revenue REAL DEFAULT 0,
                avg_session_duration REAL DEFAULT 0,
                engagement_rate REAL DEFAULT 0,
                top_performing_content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Content performance metrics
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS content_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_id TEXT,
                platform TEXT,
                post_date DATE,
                views INTEGER DEFAULT 0,
                likes INTEGER DEFAULT 0,
                comments INTEGER DEFAULT 0,
                shares INTEGER DEFAULT 0,
                revenue_generated REAL DEFAULT 0,
                engagement_score REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Subscriber journey tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subscriber_journey (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subscriber_id INTEGER,
                event_type TEXT,
                event_data TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subscriber_id) REFERENCES subscribers (id)
            )
        """)
        
        self.conn.commit()
        logger.info("✅ Analytics tables setup complete")
    
    def extract_onlyfans_data(self, source_file="../data/raw_of_analytics.csv"):
        """Extract data from OnlyFans analytics export"""
        try:
            if os.path.exists(source_file):
                df = pd.read_csv(source_file)
                logger.info(f"📥 Extracted {len(df)} records from OnlyFans data")
                return df
            else:
                # Generate sample data for demo
                logger.warning("OnlyFans data file not found, generating sample data")
                return self.generate_sample_of_data()
        except Exception as e:
            logger.error(f"Error extracting OnlyFans data: {e}")
            return pd.DataFrame()
    
    def extract_crm_data(self):
        """Extract CRM data from database"""
        try:
            # Subscribers data
            subscribers_df = pd.read_sql_query("""
                SELECT * FROM subscribers
                WHERE created_at >= date('now', '-30 days')
            """, self.conn)
            
            # CRM messages data
            messages_df = pd.read_sql_query("""
                SELECT * FROM crm_messages
                WHERE sent_at >= date('now', '-30 days')
            """, self.conn)
            
            logger.info(f"📥 Extracted {len(subscribers_df)} subscribers and {len(messages_df)} messages")
            return subscribers_df, messages_df
        except Exception as e:
            logger.error(f"Error extracting CRM data: {e}")
            return pd.DataFrame(), pd.DataFrame()
    
    def generate_sample_of_data(self):
        """Generate sample OnlyFans analytics data for demo"""
        dates = [(datetime.now() - timedelta(days=x)).strftime('%Y-%m-%d') for x in range(30)]
        
        sample_data = []
        for date in dates:
            sample_data.append({
                'date': date,
                'total_views': np.random.randint(1000, 5000),
                'unique_visitors': np.random.randint(500, 2000),
                'new_subscribers': np.random.randint(10, 100),
                'revenue': round(np.random.uniform(500, 2000), 2),
                'messages_sent': np.random.randint(50, 200),
                'likes_received': np.random.randint(100, 500),
                'posts_published': np.random.randint(1, 5)
            })
        
        return pd.DataFrame(sample_data)
    
    def transform_subscriber_data(self, subscribers_df):
        """Transform subscriber data for analytics"""
        try:
            if subscribers_df.empty:
                return pd.DataFrame()
            
            # Calculate subscription duration
            subscribers_df['subscription_duration'] = (
                pd.to_datetime('now') - pd.to_datetime(subscribers_df['subscription_date'])
            ).dt.days
            
            # Calculate engagement score
            subscribers_df['days_since_activity'] = (
                pd.to_datetime('now') - pd.to_datetime(subscribers_df['last_activity'])
            ).dt.days
            
            subscribers_df['engagement_score'] = (
                100 - subscribers_df['days_since_activity'].clip(0, 100)
            ) / 100
            
            # Create tier ranking
            tier_ranking = {'Bronze': 1, 'Silver': 2, 'Gold': 3, 'Platinum': 4}
            subscribers_df['tier_rank'] = subscribers_df['tier'].map(tier_ranking).fillna(1)
            
            logger.info("🔄 Subscriber data transformation complete")
            return subscribers_df
        except Exception as e:
            logger.error(f"Error transforming subscriber data: {e}")
            return pd.DataFrame()
    
    def calculate_daily_metrics(self, of_data, subscribers_df):
        """Calculate daily aggregated metrics"""
        try:
            daily_metrics = []
            
            # Group by date and calculate metrics
            if not of_data.empty:
                for date in of_data['date'].unique():
                    day_data = of_data[of_data['date'] == date].iloc[0]
                    
                    # Calculate engagement rate
                    engagement_rate = (
                        day_data.get('likes_received', 0) / max(day_data.get('total_views', 1), 1)
                    ) * 100
                    
                    metrics = {
                        'date': date,
                        'new_subscribers': day_data.get('new_subscribers', 0),
                        'total_revenue': day_data.get('revenue', 0),
                        'engagement_rate': round(engagement_rate, 2),
                        'total_views': day_data.get('total_views', 0),
                        'posts_published': day_data.get('posts_published', 0)
                    }
                    
                    daily_metrics.append(metrics)
            
            logger.info(f"📊 Calculated metrics for {len(daily_metrics)} days")
            return pd.DataFrame(daily_metrics)
        except Exception as e:
            logger.error(f"Error calculating daily metrics: {e}")
            return pd.DataFrame()
    
    def detect_trends(self, metrics_df):
        """Detect trends in the data"""
        try:
            if metrics_df.empty or len(metrics_df) < 7:
                return {}
            
            # Sort by date
            metrics_df = metrics_df.sort_values('date')
            
            trends = {}
            
            # Revenue trend
            recent_revenue = metrics_df.tail(7)['total_revenue'].mean()
            previous_revenue = metrics_df.iloc[-14:-7]['total_revenue'].mean() if len(metrics_df) >= 14 else 0
            
            if previous_revenue > 0:
                revenue_change = ((recent_revenue - previous_revenue) / previous_revenue) * 100
                trends['revenue_trend'] = {
                    'direction': 'up' if revenue_change > 5 else 'down' if revenue_change < -5 else 'stable',
                    'change_percent': round(revenue_change, 2)
                }
            
            # Subscriber growth trend
            recent_subs = metrics_df.tail(7)['new_subscribers'].mean()
            previous_subs = metrics_df.iloc[-14:-7]['new_subscribers'].mean() if len(metrics_df) >= 14 else 0
            
            if previous_subs > 0:
                sub_change = ((recent_subs - previous_subs) / previous_subs) * 100
                trends['subscriber_trend'] = {
                    'direction': 'up' if sub_change > 10 else 'down' if sub_change < -10 else 'stable',
                    'change_percent': round(sub_change, 2)
                }
            
            # Engagement trend
            recent_engagement = metrics_df.tail(7)['engagement_rate'].mean()
            trends['engagement_trend'] = {
                'current_rate': round(recent_engagement, 2),
                'status': 'good' if recent_engagement > 5 else 'needs_improvement'
            }
            
            logger.info("📈 Trend analysis complete")
            return trends
        except Exception as e:
            logger.error(f"Error detecting trends: {e}")
            return {}
    
    def load_to_database(self, daily_metrics_df, trends):
        """Load processed data to analytics tables"""
        try:
            cursor = self.conn.cursor()
            
            # Load daily metrics
            for _, row in daily_metrics_df.iterrows():
                cursor.execute("""
                    INSERT OR REPLACE INTO daily_analytics 
                    (date, new_subscribers, total_revenue, engagement_rate)
                    VALUES (?, ?, ?, ?)
                """, (row['date'], row['new_subscribers'], row['total_revenue'], row['engagement_rate']))
            
            # Store trends as JSON in a config table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS analytics_config (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                INSERT OR REPLACE INTO analytics_config (key, value)
                VALUES (?, ?)
            """, ('latest_trends', json.dumps(trends)))
            
            self.conn.commit()
            logger.info("💾 Data loaded to analytics tables")
        except Exception as e:
            logger.error(f"Error loading data to database: {e}")
    
    def run_pipeline(self):
        """Execute the complete ETL pipeline"""
        logger.info("🚀 Starting OFEM data pipeline...")
        
        try:
            # Extract
            of_data = self.extract_onlyfans_data()
            subscribers_df, messages_df = self.extract_crm_data()
            
            # Transform
            transformed_subs = self.transform_subscriber_data(subscribers_df)
            daily_metrics = self.calculate_daily_metrics(of_data, transformed_subs)
            trends = self.detect_trends(daily_metrics)
            
            # Load
            self.load_to_database(daily_metrics, trends)
            
            # Generate summary report
            summary = {
                'pipeline_run': datetime.now().isoformat(),
                'records_processed': {
                    'onlyfans_records': len(of_data),
                    'subscribers': len(subscribers_df),
                    'crm_messages': len(messages_df),
                    'daily_metrics': len(daily_metrics)
                },
                'trends_detected': trends,
                'status': 'success'
            }
            
            logger.info("✅ Pipeline completed successfully")
            return summary
            
        except Exception as e:
            logger.error(f"❌ Pipeline failed: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    def get_analytics_summary(self):
        """Get a summary of analytics data"""
        try:
            cursor = self.conn.cursor()
            
            # Get latest metrics
            cursor.execute("""
                SELECT * FROM daily_analytics 
                ORDER BY date DESC 
                LIMIT 7
            """)
            recent_metrics = cursor.fetchall()
            
            # Get trends
            cursor.execute("""
                SELECT value FROM analytics_config 
                WHERE key = 'latest_trends'
            """)
            trends_row = cursor.fetchone()
            trends = json.loads(trends_row[0]) if trends_row else {}
            
            return {
                'recent_metrics': recent_metrics,
                'trends': trends,
                'last_updated': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting analytics summary: {e}")
            return {}

# CLI interface
if __name__ == "__main__":
    import numpy as np  # Add import for numpy
    
    pipeline = OFEMDataPipeline()
    
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "run":
        result = pipeline.run_pipeline()
        print(json.dumps(result, indent=2))
    else:
        summary = pipeline.get_analytics_summary()
        print(json.dumps(summary, indent=2))