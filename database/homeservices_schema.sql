-- Home Services Booking SaaS Platform
-- MySQL 8.0.16+ / InnoDB / utf8mb4
-- SQLAlchemy-compatible relational schema. No backend code is included.
-- Monetary values use DECIMAL(12,2); timestamps are stored in UTC by application convention.
-- IMPORTANT: enforce state transitions, availability overlap checks, ownership checks,
-- payment signature verification and idempotency in transactional application logic.

CREATE DATABASE IF NOT EXISTS homeservices
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE homeservices;

-- 1. Common account table. One primary role per account (SRS assumption).
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role ENUM('SUPER_ADMIN','CUSTOMER','PROVIDER','TECHNICIAN') NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(254) NULL,
  phone VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  account_status ENUM('ACTIVE','INACTIVE','SUSPENDED','PENDING') NOT NULL DEFAULT 'ACTIVE',
  email_verified_at DATETIME(6) NULL,
  phone_verified_at DATETIME(6) NULL,
  last_login_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  KEY ix_users_role_status (role, account_status),
  KEY ix_users_name (full_name)
) ENGINE=InnoDB;

CREATE TABLE customer_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  date_of_birth DATE NULL,
  profile_image_url VARCHAR(1024) NULL,
  preferences_json JSON NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE provider_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  business_name VARCHAR(180) NOT NULL,
  legal_business_name VARCHAR(180) NULL,
  business_description TEXT NULL,
  business_registration_no VARCHAR(100) NULL,
  tax_identifier VARCHAR(100) NULL,
  verification_status ENUM('PENDING','UNDER_REVIEW','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  verification_rejection_reason TEXT NULL,
  verified_by_admin_id BIGINT UNSIGNED NULL,
  verified_at DATETIME(6) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_provider_user (user_id),
  UNIQUE KEY uq_provider_business_reg (business_registration_no),
  UNIQUE KEY uq_provider_tax_id (tax_identifier),
  KEY ix_provider_verification (verification_status, is_active),
  KEY ix_provider_business_name (business_name),
  CONSTRAINT fk_provider_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_provider_verifier FOREIGN KEY (verified_by_admin_id) REFERENCES users(id),
  CONSTRAINT ck_provider_rating CHECK (average_rating BETWEEN 0 AND 5)
) ENGINE=InnoDB;

CREATE TABLE technician_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NOT NULL,
  employee_code VARCHAR(50) NULL,
  skills TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_technician_user (user_id),
  UNIQUE KEY uq_technician_provider_employee (provider_id, employee_code),
  UNIQUE KEY uq_technician_provider_user (provider_id, user_id),
  KEY ix_technician_provider_active (provider_id, is_active),
  CONSTRAINT fk_technician_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_technician_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id)
) ENGINE=InnoDB;

CREATE TABLE provider_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  document_type ENUM('IDENTITY','BUSINESS_REGISTRATION','ADDRESS_PROOF','TAX','OTHER') NOT NULL,
  file_url VARCHAR(1024) NOT NULL,
  original_file_name VARCHAR(255) NULL,
  mime_type VARCHAR(100) NULL,
  review_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  reviewed_by_admin_id BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(6) NULL,
  rejection_reason TEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_provider_documents_review (provider_id, review_status),
  CONSTRAINT fk_provider_document_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id),
  CONSTRAINT fk_provider_document_reviewer FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE service_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_category_name (name),
  UNIQUE KEY uq_category_slug (slug),
  KEY ix_category_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT NULL,
  base_price DECIMAL(12,2) NOT NULL,
  estimated_duration_minutes SMALLINT UNSIGNED NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_service_provider_id (provider_id, id),
  KEY ix_service_category_active (category_id, is_active),
  KEY ix_service_provider_active (provider_id, is_active),
  KEY ix_service_name (name),
  CONSTRAINT fk_service_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id),
  CONSTRAINT fk_service_category FOREIGN KEY (category_id) REFERENCES service_categories(id),
  CONSTRAINT ck_service_price CHECK (base_price >= 0),
  CONSTRAINT ck_service_duration CHECK (estimated_duration_minutes > 0)
) ENGINE=InnoDB;

CREATE TABLE service_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(1024) NOT NULL,
  alt_text VARCHAR(255) NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_service_images_order (service_id, sort_order),
  CONSTRAINT fk_service_image_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE service_areas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'IN',
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(12) NULL,
  area_name VARCHAR(150) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_service_area_lookup (city, postal_code, is_active),
  KEY ix_service_area_provider (provider_id, service_id),
  CONSTRAINT fk_service_area_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id),
  CONSTRAINT fk_service_area_service FOREIGN KEY (service_id) REFERENCES services(id)
) ENGINE=InnoDB;

CREATE TABLE provider_availability (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL COMMENT '1=Monday ... 7=Sunday',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from DATE NULL,
  effective_until DATE NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_provider_weekly_slot (provider_id, day_of_week, start_time, end_time),
  KEY ix_provider_availability_day (provider_id, day_of_week, is_available),
  CONSTRAINT fk_availability_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE CASCADE,
  CONSTRAINT ck_availability_day CHECK (day_of_week BETWEEN 1 AND 7),
  CONSTRAINT ck_availability_time CHECK (end_time > start_time)
) ENGINE=InnoDB;

CREATE TABLE addresses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(50) NULL,
  recipient_name VARCHAR(150) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) NULL,
  landmark VARCHAR(180) NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(12) NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'IN',
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_address_customer_id (customer_id, id),
  KEY ix_address_customer_default (customer_id, is_default),
  KEY ix_address_city_postal (city, postal_code),
  CONSTRAINT fk_address_customer FOREIGN KEY (customer_id) REFERENCES customer_profiles(user_id),
  CONSTRAINT ck_address_lat CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT ck_address_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB;

CREATE TABLE bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_reference VARCHAR(32) NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  address_id BIGINT UNSIGNED NOT NULL,
  scheduled_start_at DATETIME(6) NOT NULL,
  scheduled_end_at DATETIME(6) NOT NULL,
  problem_description TEXT NULL,
  status ENUM('PENDING','ACCEPTED','REJECTED','TECHNICIAN_ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  service_name_snapshot VARCHAR(180) NOT NULL,
  service_price_snapshot DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  cancellation_reason TEXT NULL,
  cancelled_by_user_id BIGINT UNSIGNED NULL,
  completed_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_booking_reference (booking_reference),
  UNIQUE KEY uq_booking_idempotency (customer_id, idempotency_key),
  UNIQUE KEY uq_booking_provider_id (provider_id, id),
  -- Required by InnoDB so payments and reviews can reference (id, customer_id).
  UNIQUE KEY uq_booking_id_customer (id, customer_id),
  KEY ix_booking_customer_status_date (customer_id, status, scheduled_start_at),
  KEY ix_booking_provider_status_date (provider_id, status, scheduled_start_at),
  KEY ix_booking_service (service_id),
  KEY ix_booking_schedule (scheduled_start_at, scheduled_end_at),
  CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES customer_profiles(user_id),
  CONSTRAINT fk_booking_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id),
  CONSTRAINT fk_booking_service_provider FOREIGN KEY (provider_id, service_id) REFERENCES services(provider_id, id),
  CONSTRAINT fk_booking_customer_address FOREIGN KEY (customer_id, address_id) REFERENCES addresses(customer_id, id),
  CONSTRAINT fk_booking_cancel_actor FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id),
  CONSTRAINT ck_booking_time CHECK (scheduled_end_at > scheduled_start_at),
  CONSTRAINT ck_booking_amounts CHECK (service_price_snapshot >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE booking_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  uploaded_by_user_id BIGINT UNSIGNED NOT NULL,
  image_stage ENUM('PROBLEM','BEFORE','AFTER','OTHER') NOT NULL DEFAULT 'PROBLEM',
  file_url VARCHAR(1024) NOT NULL,
  caption VARCHAR(255) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_booking_images_booking_stage (booking_id, image_stage),
  CONSTRAINT fk_booking_image_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_image_uploader FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE booking_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  old_status ENUM('PENDING','ACCEPTED','REJECTED','TECHNICIAN_ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED') NULL,
  new_status ENUM('PENDING','ACCEPTED','REJECTED','TECHNICIAN_ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL,
  changed_by_user_id BIGINT UNSIGNED NULL,
  change_note TEXT NULL,
  changed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_booking_history_time (booking_id, changed_at),
  KEY ix_booking_history_actor (changed_by_user_id, changed_at),
  CONSTRAINT fk_booking_history_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_history_actor FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE technician_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NOT NULL,
  technician_user_id BIGINT UNSIGNED NOT NULL,
  assigned_by_user_id BIGINT UNSIGNED NOT NULL,
  assignment_status ENUM('ASSIGNED','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED','REASSIGNED') NOT NULL DEFAULT 'ASSIGNED',
  assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  started_at DATETIME(6) NULL,
  completed_at DATETIME(6) NULL,
  ended_at DATETIME(6) NULL,
  notes TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assignment_provider_booking_id (provider_id, booking_id, id),
  KEY ix_assignment_technician_status (technician_user_id, assignment_status, assigned_at),
  KEY ix_assignment_booking_status (booking_id, assignment_status),
  CONSTRAINT fk_assignment_booking_provider FOREIGN KEY (provider_id, booking_id) REFERENCES bookings(provider_id, id),
  CONSTRAINT fk_assignment_technician_provider FOREIGN KEY (provider_id, technician_user_id) REFERENCES technician_profiles(provider_id, user_id),
  CONSTRAINT fk_assignment_assigner FOREIGN KEY (assigned_by_user_id) REFERENCES users(id),
  CONSTRAINT ck_assignment_completion CHECK (completed_at IS NULL OR started_at IS NOT NULL)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  attempt_number SMALLINT UNSIGNED NOT NULL,
  gateway VARCHAR(40) NOT NULL DEFAULT 'RAZORPAY',
  gateway_order_id VARCHAR(100) NULL,
  gateway_payment_id VARCHAR(100) NULL,
  transaction_reference VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('PENDING','PROCESSING','PAID','FAILED','REFUNDED','PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
  gateway_signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at DATETIME(6) NULL,
  failure_code VARCHAR(100) NULL,
  failure_message TEXT NULL,
  receipt_url VARCHAR(1024) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_transaction_ref (transaction_reference),
  UNIQUE KEY uq_payment_attempt (booking_id, attempt_number),
  UNIQUE KEY uq_payment_gateway_payment (gateway, gateway_payment_id),
  UNIQUE KEY uq_payment_gateway_order (gateway, gateway_order_id),
  KEY ix_payment_customer_status (customer_id, status, created_at),
  KEY ix_payment_booking_status (booking_id, status),
  CONSTRAINT fk_payment_booking_customer FOREIGN KEY (booking_id, customer_id) REFERENCES bookings(id, customer_id),
  CONSTRAINT ck_payment_amount CHECK (amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE refunds (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id BIGINT UNSIGNED NOT NULL,
  refund_reference VARCHAR(100) NOT NULL,
  gateway_refund_id VARCHAR(100) NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('PENDING','PROCESSING','SUCCEEDED','FAILED') NOT NULL DEFAULT 'PENDING',
  reason TEXT NULL,
  approved_by_admin_id BIGINT UNSIGNED NULL,
  processed_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_refund_reference (refund_reference),
  UNIQUE KEY uq_gateway_refund (gateway_refund_id),
  KEY ix_refund_payment_status (payment_id, status),
  CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_refund_approver FOREIGN KEY (approved_by_admin_id) REFERENCES users(id),
  CONSTRAINT ck_refund_amount CHECK (amount > 0)
) ENGINE=InnoDB;

CREATE TABLE commissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NOT NULL,
  calculation_type ENUM('PERCENTAGE','FIXED') NOT NULL,
  rate_value DECIMAL(8,4) NOT NULL,
  gross_amount DECIMAL(12,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  provider_earning_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('CALCULATED','ADJUSTED','SETTLED','REVERSED') NOT NULL DEFAULT 'CALCULATED',
  calculated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  settled_at DATETIME(6) NULL,
  notes TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_commission_payment (payment_id),
  KEY ix_commission_provider_status (provider_id, status, calculated_at),
  CONSTRAINT fk_commission_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_commission_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id),
  CONSTRAINT ck_commission_amounts CHECK (gross_amount >= 0 AND commission_amount >= 0 AND provider_earning_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  provider_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  review_text TEXT NULL,
  moderation_status ENUM('VISIBLE','HIDDEN','PENDING') NOT NULL DEFAULT 'VISIBLE',
  moderated_by_admin_id BIGINT UNSIGNED NULL,
  moderated_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_review_booking (booking_id),
  KEY ix_review_provider_status_date (provider_id, moderation_status, created_at),
  KEY ix_review_customer (customer_id, created_at),
  CONSTRAINT fk_review_booking_customer FOREIGN KEY (booking_id, customer_id) REFERENCES bookings(id, customer_id),
  CONSTRAINT fk_review_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id),
  CONSTRAINT fk_review_moderator FOREIGN KEY (moderated_by_admin_id) REFERENCES users(id),
  CONSTRAINT ck_review_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE complaints (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  raised_by_user_id BIGINT UNSIGNED NOT NULL,
  assigned_admin_id BIGINT UNSIGNED NULL,
  subject VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('OPEN','UNDER_REVIEW','WAITING_FOR_INFORMATION','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  provider_response TEXT NULL,
  resolution TEXT NULL,
  resolved_by_admin_id BIGINT UNSIGNED NULL,
  resolved_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_complaint_status_date (status, created_at),
  KEY ix_complaint_booking (booking_id),
  KEY ix_complaint_raiser (raised_by_user_id, created_at),
  CONSTRAINT fk_complaint_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_complaint_raiser FOREIGN KEY (raised_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_complaint_assignee FOREIGN KEY (assigned_admin_id) REFERENCES users(id),
  CONSTRAINT fk_complaint_resolver FOREIGN KEY (resolved_by_admin_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  notification_type VARCHAR(60) NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(40) NULL,
  related_entity_id BIGINT UNSIGNED NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_notification_user_read_date (user_id, is_read, created_at),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE coupons (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  description VARCHAR(255) NULL,
  discount_type ENUM('PERCENTAGE','FIXED') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount_amount DECIMAL(12,2) NULL,
  minimum_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  starts_at DATETIME(6) NULL,
  expires_at DATETIME(6) NULL,
  max_redemptions INT UNSIGNED NULL,
  per_customer_limit SMALLINT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_coupon_code (code),
  KEY ix_coupon_active_dates (is_active, starts_at, expires_at),
  CONSTRAINT ck_coupon_discount CHECK (discount_value > 0 AND minimum_order_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE subscription_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  billing_interval ENUM('MONTHLY','YEARLY') NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  features_json JSON NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscription_plan_name_interval (name, billing_interval),
  KEY ix_subscription_plan_active (is_active),
  CONSTRAINT ck_subscription_price CHECK (price >= 0)
) ENGINE=InnoDB;

CREATE TABLE provider_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  status ENUM('PENDING','ACTIVE','PAST_DUE','CANCELLED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  starts_at DATETIME(6) NOT NULL,
  ends_at DATETIME(6) NOT NULL,
  price_snapshot DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  external_subscription_ref VARCHAR(120) NULL,
  cancelled_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_provider_external_subscription (external_subscription_ref),
  KEY ix_provider_subscription_status_dates (provider_id, status, starts_at, ends_at),
  CONSTRAINT fk_provider_subscription_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id),
  CONSTRAINT fk_provider_subscription_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  CONSTRAINT ck_provider_subscription_dates CHECK (ends_at > starts_at),
  CONSTRAINT ck_provider_subscription_price CHECK (price_snapshot >= 0)
) ENGINE=InnoDB;

-- SAMPLE DATA (minimal connected happy-path example)
INSERT INTO users (id, role, full_name, email, phone, password_hash) VALUES
(1,'SUPER_ADMIN','Platform Admin','admin@example.test','9000000001','$argon2id$sample_hash_not_for_login'),
(2,'CUSTOMER','Rahul Sharma','rahul@example.test','9000000002','$argon2id$sample_hash_not_for_login'),
(3,'PROVIDER','ABC AC Services','provider@example.test','9000000003','$argon2id$sample_hash_not_for_login'),
(4,'TECHNICIAN','Amit Patel','amit@example.test','9000000004','$argon2id$sample_hash_not_for_login');

INSERT INTO customer_profiles (user_id) VALUES (2);
INSERT INTO provider_profiles (id,user_id,business_name,verification_status,verified_by_admin_id,verified_at)
VALUES (10,3,'ABC AC Services','APPROVED',1,CURRENT_TIMESTAMP(6));
INSERT INTO technician_profiles (id,user_id,provider_id,employee_code,skills)
VALUES (20,4,10,'TECH-001','AC repair, installation');

INSERT INTO service_categories (id,name,slug) VALUES (1,'Air Conditioning','air-conditioning');
INSERT INTO services (id,provider_id,category_id,name,description,base_price,estimated_duration_minutes)
VALUES (100,10,1,'AC Repair','AC inspection and repair service',1000.00,90);
INSERT INTO service_areas (provider_id,service_id,country_code,state,city,postal_code)
VALUES (10,100,'IN','Gujarat','Ahmedabad','380001');
INSERT INTO provider_availability (provider_id,day_of_week,start_time,end_time)
VALUES (10,1,'09:00:00','18:00:00');

INSERT INTO addresses (id,customer_id,label,recipient_name,recipient_phone,address_line1,city,state,postal_code)
VALUES (50,2,'Home','Rahul Sharma','9000000002','12 Example Road','Ahmedabad','Gujarat','380001');

INSERT INTO bookings (
 id,booking_reference,idempotency_key,customer_id,provider_id,service_id,address_id,
 scheduled_start_at,scheduled_end_at,problem_description,status,
 service_name_snapshot,service_price_snapshot,discount_amount,tax_amount,total_amount
) VALUES (
 500,'HS-2026-000500','rahul-booking-001',2,10,100,50,
 '2026-11-10 10:00:00.000000','2026-11-10 11:30:00.000000',
 'AC is not cooling','TECHNICIAN_ASSIGNED',
 'AC Repair',1000.00,0.00,0.00,1000.00
);

INSERT INTO booking_status_history (booking_id,old_status,new_status,changed_by_user_id,change_note)
VALUES
(500,NULL,'PENDING',2,'Booking submitted'),
(500,'PENDING','ACCEPTED',3,'Provider accepted'),
(500,'ACCEPTED','TECHNICIAN_ASSIGNED',3,'Technician assigned');

INSERT INTO technician_assignments (
 booking_id,provider_id,technician_user_id,assigned_by_user_id,assignment_status,assigned_at
) VALUES (500,10,4,3,'ASSIGNED',CURRENT_TIMESTAMP(6));

INSERT INTO payments (
 id,booking_id,customer_id,attempt_number,gateway,gateway_order_id,gateway_payment_id,
 transaction_reference,amount,status,gateway_signature_verified,paid_at
) VALUES (
 700,500,2,1,'RAZORPAY','order_test_700','pay_test_700',
 'TXN-HS-700',1000.00,'PAID',TRUE,CURRENT_TIMESTAMP(6)
);

INSERT INTO commissions (
 payment_id,provider_id,calculation_type,rate_value,gross_amount,commission_amount,provider_earning_amount
) VALUES (700,10,'PERCENTAGE',10.0000,1000.00,100.00,900.00);

INSERT INTO reviews (booking_id,customer_id,provider_id,rating,review_text)
VALUES (500,2,10,5,'Professional and prompt service');

INSERT INTO notifications (user_id,notification_type,title,message,related_entity_type,related_entity_id)
VALUES
(3,'NEW_BOOKING','New booking request','A customer has requested AC Repair.','BOOKING',500),
(4,'TECHNICIAN_ASSIGNED','New job assigned','You have been assigned booking HS-2026-000500.','BOOKING',500);

-- Example refund (optional; keep payment/refund state transitions synchronized in application logic)
-- INSERT INTO refunds (payment_id,refund_reference,amount,status,reason,approved_by_admin_id)
-- VALUES (700,'RF-HS-700',100.00,'PENDING','Partial service adjustment',1);
