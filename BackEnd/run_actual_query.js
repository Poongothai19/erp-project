const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    database: 'Jobpost',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const query = `
      SELECT
        c.CandidateId,
        c.CandidateCode,
        c.FirstName,
        c.MiddleName,
        c.LastName,
        c.DateOfBirth,
        c.Phone,
        c.Mobile,
        c.JobTitle,
        c.YearsOfExperience,
        c.CandidateStatus,
        c.WorkAuthorization,
        c.SecurityClearance,
        c.WillingToRelocate,
        c.IsBench,
        c.RemoteStatus,
        c.EmploymentType,
        c.ExpectedRateFrom,
        c.ExpectedRateTo,
        c.ExpectedRateType,
        c.CurrentRate,
        c.CurrentRateType,
        c.Gender,
        c.MaritalStatus,
        c.Industry,
        c.ProfileSummary,
        c.LinkedInUrl,
        c.GitHubUrl,
        c.TwitterUrl,
        c.VideoResumeUrl,
        c.CreatedAtUtc,
        c.UpdatedAtUtc,
        -- primary email
        ci_email.IdentityValue  AS Email,
        -- primary phone
        ci_phone.IdentityValue  AS PrimaryPhone,
        -- primary document info (without binary data)
        d.DocumentId,
        d.FileNameOriginal,
        d.FileExtension,
        d.MimeType,
        d.FileSizeBytes,
        d.ParseStatus,
        d.UploadedOn,
        loc.CityName,
        loc.StateCode,
        loc.CountryName,
        loc.CountryIso2,
        c.EmployeeId
      FROM [recruit].[Candidate] c
      LEFT JOIN (
        SELECT CandidateId, IdentityValue
        FROM [recruit].[CandidateIdentity]
        WHERE IdentityType = 'Email' AND IsPrimary = 1
      ) ci_email ON ci_email.CandidateId = c.CandidateId
      LEFT JOIN (
        SELECT CandidateId, IdentityValue
        FROM [recruit].[CandidateIdentity]
        WHERE IdentityType = 'Phone' AND IsPrimary = 1
      ) ci_phone ON ci_phone.CandidateId = c.CandidateId
      LEFT JOIN (
        SELECT CandidateId, DocumentId, FileNameOriginal, FileExtension,
               MimeType, FileSizeBytes, ParseStatus, UploadedOn, ExtractedTitle,
               ROW_NUMBER() OVER (PARTITION BY CandidateId ORDER BY IsPrimaryResume DESC, UploadedOn DESC) rn
        FROM [recruit].[CandidateDocument]
        WHERE IsDeleted = 0
      ) d ON d.CandidateId = c.CandidateId AND d.rn = 1
      LEFT JOIN (
        SELECT ea.EntityId,
               city.Name AS CityName,
               state.Code AS StateCode,
               country.Name AS CountryName,
               country.Iso2 AS CountryIso2,
               ROW_NUMBER() OVER(PARTITION BY ea.EntityId ORDER BY ea.IsPrimary DESC, ea.CreatedAtUtc DESC) as rn
        FROM [core].[EntityAddress] ea
        INNER JOIN [core].[Address] a ON ea.AddressId = a.AddressId
        LEFT JOIN [core].[City] city ON a.CityId = city.CityId
        LEFT JOIN [core].[StateProvince] state ON city.StateId = state.StateId
        LEFT JOIN [core].[Country] country ON state.CountryId = country.CountryId
        WHERE ea.EntityType = 'Candidate'
      ) loc ON loc.EntityId = c.CandidateId AND loc.rn = 1
      WHERE c.IsDeleted = 0
      ORDER BY c.CreatedAtUtc DESC
`;

async function runTestQuery() {
    try {
        let pool = await sql.connect(config);
        console.log("Running query...");
        const result = await pool.request().query(query);
        console.log("Query success! Records returned:", result.recordset.length);
        await pool.close();
    } catch (err) {
        console.error("QUERY FAILED!");
        console.error("Message:", err.message);
        if (err.precedingErrors) {
            console.error("Preceding Errors:", err.precedingErrors);
        }
    }
}

runTestQuery();
