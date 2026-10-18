-- // USER
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- // Event form 
CREATE TYPE event_ticket_type AS ENUM (
    'Gala',
    'Summit',
    'Youth' 
);

CREATE TABLE event_forms (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    tickets INT NOT NULL CHECK (tickets > 0),
    image_url TEXT NOT NULL,
    event_date DATE NOT NULL,
    tickets_type event_ticket_type NOT NULL,
);  

-- // News form 
CREATE TABLE news_blog_form (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    image_url TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)


CREATE TYPE country_title AS ENUM (
    'Afghanistan', 'Algeria', 'Angola', 'Argentina',
    'Australia', 'Austria', 'Azerbaijan', 'Bahrain',
    'Bangladesh', 'Belgium', 'Benin', 'Bolivia',
    'Bosnia and Herzegovina', 'Botswana', 'Brazil',
    'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde',
    'Cambodia', 'Cameroon', 'Canada',
    'Central African Republic', 'Chad', 'Chile', 'China',
    'Colombia', 'Comoros', 'Congo', 'Costa Rica',
    'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Democratic Republic of the Congo', 'Denmark',
    'Djibouti', 'Dominican Republic', 'Ecuador', 'Egypt',
    'El Salvador', 'Equatorial Guinea', 'Eritrea',
    'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana',
    'Greece', 'Guatemala', 'Guinea', 'Guinea-Bissau',
    'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India',
    'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
    'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kuwait', 'Laos', 'Lebanon',
    'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
    'Malaysia', 'Mali', 'Mauritania', 'Mauritius', 'Mexico',
    'Mongolia', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nepal', 'Netherlands', 'New Zealand',
    'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia',
    'Norway', 'Oman', 'Pakistan', 'Panama',
    'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
    'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
    'Rwanda', 'Sao Tome and Principe', 'Saudi Arabia',
    'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
    'Singapore', 'Slovakia', 'Slovenia', 'Somalia',
    'South Africa', 'South Korea', 'South Sudan', 'Spain',
    'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria',
    'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago',
    'Tunisia', 'Turkey', 'Uganda', 'Ukraine',
    'United Arab Emirates', 'United Kingdom',
    'United States', 'Uruguay', 'Uzbekistan', 'Venezuela',
    'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
);

CREATE TYPE professional_title AS ENUM (
    'Student', 'Intern', 'Volunteer', 'Job Seeker',
    'Farmer', 'Agripreneur', 'Livestock Farmer',
    'Fisherman', 'Shopkeeper', 'Trader',
    'Small Business Owner', 'Artisan', 'Tailor',
    'Driver', 'Mechanic', 'Electrician',
    'Self-Help Group Leader', 'Village Head',
    'Traditional Chief', 'Community Health Worker',
    'Activist', 'Mentor', 'Teacher', 'Principal',
    'Lecturer', 'Researcher', 'Doctor', 'Nurse',
    'Pharmacist', 'Government Officer',
    'Local Government Official', 'Police Officer',
    'Engineer', 'Software Developer', 'Accountant',
    'Lawyer', 'Journalist', 'Designer', 'Consultant',
    'Manager', 'Other'
);

CREATE TYPE document_type AS ENUM (
    'Impact_reports',
    'Additional_supporting_evidence'
);


CREATE TABLE africa_time_award (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- SECTION A: Award category
    award_category VARCHAR(100) NOT NULL
        CHECK (
            award_category IN (
                'Youth Africa Times Award (Main Award)',
                'Youth African NGO of the Year',
                'Youth African Innovation Award',
                'Youth African Social Impact Leader Award',
                'Youth African Changemaker Award',
                'Youth African Humanitarian of the Year',
                'Youth African Community Impact Award'
            )
        ),

    -- SECTION B: Applicant information
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone_number VARCHAR(25),
    country country_title NOT NULL,
    city VARCHAR(100) NOT NULL,

    -- SECTION C: Professional information
    professional_title professional_title NOT NULL,
    organization VARCHAR(200) NOT NULL,
    biography_profile TEXT NOT NULL,
    major_achievements TEXT,
    impact_on_people TEXT NOT NULL,
    why_candidate_deserves_award TEXT,

    -- SECTION D: Photograph
    formal_portrait_photograph TEXT NOT NULL,

    -- SECTION E: Videos
    video_1_personal_introduction TEXT NOT NULL,
    video_2_achievements_and_work TEXT NOT NULL,
    video_3_evidence_of_impact TEXT NOT NULL,
    video_4_award_statement_and_vision TEXT NOT NULL,

    -- SECTION F: Project photographs
    photo_1_candidate_performing TEXT NOT NULL,
    photo_2_showing_project TEXT NOT NULL,

    -- SECTION G: Evidence of impact
    explanation_of_impact TEXT NOT NULL,

    -- SECTION H: Declaration and consent
    consent_to_submit_media BOOLEAN NOT NULL DEFAULT FALSE,
    declaration_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    applicant_representative_name VARCHAR(150) NOT NULL,
    signature_storage_path TEXT,
    declaration_date DATE NOT NULL,

    -- Application timestamp
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);