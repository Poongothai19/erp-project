# LinkedIn Job Posting Setup Guide for New Recruiters

This document explains the two-phase process required to give a new recruiter access to post jobs to their personal LinkedIn profile directly from the Prophecy ERP system.

---

## Phase 1: What the Super Admin Does
*You only need to do this once per new employee.*

1. Go to the [LinkedIn Developer Portal](https://developer.linkedin.com/) and log in with the admin account.
2. Open your **Prophecy ERP App**.
3. Click on the **Team Members** tab on the left-hand navigation menu.
4. Click the **Add team member** button.
5. Search for the new recruiter's LinkedIn profile name and add them with the role of **Developer**.

---

## Phase 2: What the New Recruiter Does
*Copy and paste these exact instructions to your new recruiter.*

### Step 1: Accept the Invite
1. Log into your personal LinkedIn account.
2. Check your notifications and accept the invitation to join the "Prophecy ERP" Developer App.

### Step 2: Generate Your Token
1. Go to the [LinkedIn Developer Portal](https://developer.linkedin.com/).
2. Click on **My Apps** at the top, and select the **Prophecy ERP** app.
3. On the left menu, click on the **Auth** tab.
4. Scroll down to the bottom where it says **OAuth 2.0 tools** and click the **Generate Token** button.
5. A popup will appear asking you to select scopes. Make sure **w_member_social**, **openid**, and **profile** are checked.
6. Click **Request Access Token**.
7. Copy the generated token string.

### Step 3: Add the Token to the ERP
1. Log into the **Prophecy ERP Recruitment Dashboard**.
2. Go to **Settings** -> **Social Media Configurations**.
3. In the LinkedIn section, paste the token you just generated into the **Personal Access Token** field.
4. Click **Connect/Save**.

You are now fully set up to post jobs directly to your LinkedIn profile with a single click!
