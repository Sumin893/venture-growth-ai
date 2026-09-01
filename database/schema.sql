CREATE DATABASE IF NOT EXISTS growth_ai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE growth_ai_db;

CREATE TABLE IF NOT EXISTS companies (
  company_id INT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  search_name VARCHAR(255) NOT NULL,
  founded_year INT NULL,
  company_age DOUBLE NULL,
  venture_type VARCHAR(100) NULL,
  venture_renewal VARCHAR(50) NULL,
  industry VARCHAR(100) NULL,
  sub_industry VARCHAR(150) NULL,
  industry_code VARCHAR(50) NULL,
  region VARCHAR(80) NULL,
  macro_region VARCHAR(80) NULL,
  id_confidence VARCHAR(80) NULL,
  has_dart BOOLEAN NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_companies_search_name (search_name),
  INDEX idx_companies_company_name (company_name),
  INDEX idx_companies_industry (industry)
);

CREATE TABLE IF NOT EXISTS company_features (
  company_id INT NOT NULL,
  feature_year INT NOT NULL,
  period_end DATE NULL,
  company_age DOUBLE NULL,
  age_basis VARCHAR(100) NULL,
  company_age_estimated BOOLEAN NULL,
  growth_stage_proxy VARCHAR(150) NULL,
  PRIMARY KEY (company_id, feature_year),
  CONSTRAINT fk_company_features_company FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE IF NOT EXISTS financial_features (
  company_id INT NOT NULL,
  feature_year INT NOT NULL,
  period_end DATE NULL,
  has_financial BOOLEAN NULL,
  financial_source VARCHAR(80) NULL,
  n_financial_years INT NULL,
  revenue_growth_1y DOUBLE NULL,
  revenue_cagr_3y DOUBLE NULL,
  revenue_cagr_best DOUBLE NULL,
  asset_growth_1y DOUBLE NULL,
  asset_cagr_3y DOUBLE NULL,
  operating_margin DOUBLE NULL,
  operating_margin_change_1y DOUBLE NULL,
  net_margin DOUBLE NULL,
  roa DOUBLE NULL,
  liabilities_to_assets DOUBLE NULL,
  current_ratio DOUBLE NULL,
  cash_ratio DOUBLE NULL,
  borrowings_to_assets DOUBLE NULL,
  operating_cashflow_margin DOUBLE NULL,
  operating_cashflow_positive BOOLEAN NULL,
  rd_to_revenue DOUBLE NULL,
  turned_profitable_1y BOOLEAN NULL,
  is_profitable BOOLEAN NULL,
  pre_revenue BOOLEAN NULL,
  equity_negative BOOLEAN NULL,
  revenue_log DOUBLE NULL,
  PRIMARY KEY (company_id, feature_year),
  CONSTRAINT fk_financial_company FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE IF NOT EXISTS patent_features (
  company_id INT NOT NULL,
  feature_year INT NOT NULL,
  period_end DATE NULL,
  has_patent BOOLEAN NULL,
  patent_momentum DOUBLE NULL,
  patent_count_3y INT NULL,
  patent_count_1y INT NULL,
  new_patent_activity BOOLEAN NULL,
  patent_per_year DOUBLE NULL,
  registered_ratio_mature DOUBLE NULL,
  unique_ipc_count INT NULL,
  new_ipc_count_1y INT NULL,
  PRIMARY KEY (company_id, feature_year),
  CONSTRAINT fk_patent_company FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE IF NOT EXISTS employment_features (
  company_id INT PRIMARY KEY,
  company_name VARCHAR(255) NULL,
  employee_count_latest INT NULL,
  employee_growth_6m DOUBLE NULL,
  net_hiring_rate_6m DOUBLE NULL,
  employee_growth_acceleration DOUBLE NULL,
  employee_growth_slope DOUBLE NULL,
  employee_volatility DOUBLE NULL,
  CONSTRAINT fk_employment_company FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE IF NOT EXISTS news_event_features (
  company_id INT PRIMARY KEY,
  growth_event_12m_count INT NULL,
  high_intensity_event_12m_count INT NULL,
  investment_event_24m_count INT NULL,
  contract_event_12m_count INT NULL,
  technology_rnd_event_12m_count INT NULL,
  recent_growth_event_days INT NULL,
  event_type_diversity_12m INT NULL,
  positive_negative_balance_12m DOUBLE NULL,
  news_observability_flag BOOLEAN NULL,
  CONSTRAINT fk_news_company FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE IF NOT EXISTS industries (
  industry_id INT AUTO_INCREMENT PRIMARY KEY,
  industry_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS industry_features (
  industry_group_code VARCHAR(80) PRIMARY KEY,
  industry_revenue_growth_1y DOUBLE NULL,
  industry_employee_growth_1y DOUBLE NULL,
  industry_company_growth_1y DOUBLE NULL,
  industry_rd_growth_1y DOUBLE NULL,
  industry_startup_rate_latest DOUBLE NULL
);

CREATE TABLE IF NOT EXISTS growth_scores (
  score_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  growth_score DECIMAL(5,2) NOT NULL,
  growth_grade VARCHAR(5) NOT NULL,
  growth_rank INT NOT NULL,
  growth_percentile DECIMAL(5,2) NOT NULL,
  industry_growth_rank INT NULL,
  industry_growth_percentile DECIMAL(5,2) NULL,
  financial_score DECIMAL(5,2) NOT NULL,
  patent_score DECIMAL(5,2) NOT NULL,
  employment_score DECIMAL(5,2) NOT NULL,
  news_event_score DECIMAL(5,2) NOT NULL,
  industry_score DECIMAL(5,2) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  calculated_at DATETIME NOT NULL,
  is_mock BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY uq_growth_scores_company_model (company_id, model_version),
  INDEX idx_growth_scores_latest (company_id, is_mock, calculated_at),
  CONSTRAINT fk_growth_scores_company FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE IF NOT EXISTS growth_score_factors (
  factor_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  category ENUM('financial', 'patent', 'employment', 'news_event', 'industry') NOT NULL,
  feature_name VARCHAR(120) NOT NULL,
  feature_value VARCHAR(255) NULL,
  contribution DECIMAL(8,3) NOT NULL,
  direction ENUM('positive', 'negative') NOT NULL,
  description VARCHAR(500) NOT NULL,
  display_order INT NOT NULL,
  INDEX idx_factors_company_model (company_id, model_version),
  CONSTRAINT fk_factors_company FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE IF NOT EXISTS growth_events (
  event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  event_date DATE NULL,
  published_at DATETIME NULL,
  event_type VARCHAR(80) NULL,
  event_direction ENUM('positive', 'neutral', 'negative') NULL,
  event_intensity VARCHAR(50) NULL,
  event_confidence DOUBLE NULL,
  sentiment VARCHAR(50) NULL,
  title VARCHAR(255) NULL,
  news_title VARCHAR(500) NULL,
  summary TEXT NULL,
  event_summary TEXT NULL,
  source_name VARCHAR(120) NULL,
  source_domain VARCHAR(160) NULL,
  source_url VARCHAR(500) NULL,
  original_link VARCHAR(1000) NULL,
  naver_link VARCHAR(1000) NULL,
  raw_event_hash CHAR(64) NULL,
  UNIQUE KEY uq_growth_events_raw_hash (raw_event_hash),
  INDEX idx_events_company_date (company_id, event_date),
  INDEX idx_events_company_published (company_id, published_at),
  CONSTRAINT fk_events_company FOREIGN KEY (company_id) REFERENCES companies(company_id)
);
