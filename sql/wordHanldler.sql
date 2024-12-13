DECLARE @searchTerm NVARCHAR(100) = '우병'; -- 검색할 단어

-- 병원 코드 조회
SELECT 
    '병원' AS Category,
    [sfa_cd] AS Code,
    [hos_name] AS Name
FROM [dbo].[HOSPITAL_TB]
WHERE [hos_name] LIKE '%' + @searchTerm + '%'

UNION ALL

-- CSO 코드 조회 (딜러명 또는 회사명 검색)
SELECT 
    'CSO' AS Category,
    [cso_cd] AS Code,
    CASE 
        WHEN [cso_dealer_nm] LIKE '%' + @searchTerm + '%' THEN [cso_dealer_nm]
        WHEN [cso_corp_nm] LIKE '%' + @searchTerm + '%' THEN [cso_corp_nm]
    END AS Name
FROM [dbo].[CSO_TB]
WHERE [cso_dealer_nm] LIKE '%' + @searchTerm + '%'
   OR [cso_corp_nm] LIKE '%' + @searchTerm + '%'

UNION ALL

-- 의약품 코드 조회
SELECT 
    '의약품' AS Category,
    [drug_cd] AS Code,
    [drug_name] AS Name
FROM [dbo].[PRODUCT_TB]
WHERE [drug_name] LIKE '%' + @searchTerm + '%';
