/**
 * IACS Exchange File Generator (Data Object Input)
 *
 * This function takes a structured data object and generates a compliant XML
 * string based on the IACS Exchange File Technical Specification (v1.8).
 */

// --- 1. Constants and Helpers ---

// Utility to create attribute strings (escapes quotes are not strictly needed here
// as values are IDs/dates/codes, but good practice for full XML generation)
//

// import fs from "fs";

const attr = (name, value) => {
  // Only include attributes if the value is defined and not null
  if (value !== undefined && value !== null) {
    return `${name}="${value}" `;
  }
  return "";
};

const INDENT = "  ";

// --- 2. Core Generation Functions ---

/**
 * Generates the XML string for a single <status> element.
 */
const generateStatusXML = (status) => {
  const statusAttrs =
    attr("cStatus", status.cStatus) +
    attr("dStatus", status.dStatus) +
    attr("cReason", status.cReason);
  return `${INDENT}${INDENT}<status ${statusAttrs.trim()}/>`;
};

/**
 * Generates the XML string for a single <certificate> element (Class, SMC, or DOC).
 */
const generateCertificateXML = (cert) => {
  // Core Attributes
  let certAttrs =
    attr("cTypeCertificate", cert.cTypeCertificate || "DOC") + // Default to DOC for company certs
    attr("dSurvey", cert.dSurvey) +
    attr("dNextSurvey", cert.dNextSurvey);

  // Additional Attributes specific to SMC/DOC
  certAttrs += attr("cFlag", cert.cFlag);

  if (cert.cTypeCertificate === "SMC") {
    certAttrs += attr("cConvOrVol", cert.cConvOrVol) + attr("idCompany", cert.idCompany);
  } else if (cert.cTypeCertificate === "DOC" || !cert.cTypeCertificate) {
    // ShipType for DOC is a space-separated string of codes
    const shipTypeString = Array.isArray(cert.shipType) ? cert.shipType.join(" ") : cert.shipType;
    certAttrs += attr("shipType", shipTypeString);
  }

  const statusesXML = (cert.statuses || []).map(generateStatusXML).join("\n");

  if (statusesXML) {
    return `${INDENT}<certificate ${certAttrs.trim()}>
${statusesXML}
${INDENT}</certificate>`;
  }
  return `${INDENT}<certificate ${certAttrs.trim()}/>`;
};

/**
 * Generates the XML string for a single <ship> element.
 */
const generateShipXML = (ship) => {
  const allCertificates = [...(ship.certificates || []), ...(ship.mmsCertificates || [])];

  if (allCertificates.length === 0) return "";

  const certsXML = allCertificates.map(generateCertificateXML).join("\n");

  // Optional <shipInfo> element
  let shipInfoXML = "";
  if (ship.shipInfo) {
    const info = ship.shipInfo;
    const infoAttrs =
      attr("shipName", info.shipName) +
      attr("callsign", info.callsign) +
      attr("flag", info.flag) +
      attr("gt", info.gt) +
      attr("shipType", info.shipType);
    shipInfoXML = `${INDENT}<shipInfo ${infoAttrs.trim()}/>\n`;
  }

  return `<ship idIMO="${ship.idIMO}">
${shipInfoXML}${certsXML}
</ship>`;
};

/**
 * Generates the XML string for a single <company> element.
 */
const generateCompanyXML = (company) => {
  if ((company.certificates || []).length === 0) return "";

  // The user input structure for company certificates doesn't explicitly name cTypeCertificate="DOC",
  // so we assume it is DOC and add it for compliance (since DOC is mandatory for <company>).
  const certificatesWithDocType = company.certificates.map((cert) => ({
    ...cert,
    cTypeCertificate: "DOC",
  }));

  const certsXML = certificatesWithDocType.map(generateCertificateXML).join("\n");

  return `<company ID_COMPANY="${company.idCompany}">
${certsXML}
</company>`;
};

/**
 * Main function to generate the final IACS Exchange XML.
 * @param {Object} data - The structured input object.
 * @returns {string} The complete XML document string.
 */
const generateIACSExchangeXML = (data) => {
  // 1. Root Attributes
  const rootAttrs =
    attr("provider", data.provider) +
    attr("release", data.release) +
    attr("dReference", data.dReference) +
    attr("classSupplied", data.classSupplied) +
    attr("smcSupplied", data.smcSupplied) +
    attr("docSupplied", data.docSupplied);

  const schemaLocation = data.xsiSchema || "classImportv1.8.xsd";

  // 2. Entity XML (Ships and Companies)
  const shipsXML = (data.ships || [])
    .map(generateShipXML)
    .filter((xml) => xml.length > 0) // Remove empty ships
    .join("\n\n");

  const companiesXML = (data.companies || [])
    .map(generateCompanyXML)
    .filter((xml) => xml.length > 0) // Remove empty companies
    .join("\n\n");

  // 3. Combine XML parts
  const bodyXML = [shipsXML, companiesXML].filter((xml) => xml.length > 0).join("\n\n");

  // 4. Final Document Structure
  return `<?xml version="1.0" encoding="utf-8"?>
<classExport
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="${schemaLocation}"
  ${rootAttrs.trim()}>

${bodyXML}
</classExport>`;
};

export { generateIACSExchangeXML };

// // --- 3. Detailed Example Usage (Using Your Input Object) ---

// const data = {
//   provider: "BV",
//   release: "1.8",
//   dReference: "20070101",
//   classSupplied: "Y",
//   smcSupplied: "Y",
//   docSupplied: "Y",
//   xsiSchema: "classImportv1.8.xsd",
//   ships: [
//     {
//       idIMO: "9876543",
//       shipInfo: {
//         shipName: "MV Example",
//         callsign: "ABC123",
//         flag: "GBR",
//         gt: "10500",
//         shipType: "01",
//       },
//       certificates: [
//         // CLASS Certificates
//         {
//           cTypeCertificate: "CLASS",
//           dSurvey: "20060101",
//           dNextSurvey: "20110101",
//           statuses: [
//             { cStatus: "sus", dStatus: "20051103", cReason: "d" },
//             { cStatus: "rei", dStatus: "20060101" },
//           ],
//         },
//       ],
//       mmsCertificates: [
//         // SMC Certificates
//         {
//           cTypeCertificate: "SMC",
//           cFlag: "GBR",
//           cConvOrVol: "C",
//           dSurvey: "20061215",
//           dNextSurvey: "20091215",
//           idCompany: "7654321",
//           statuses: [{ cStatus: "act", dStatus: "20061215" }],
//         },
//       ],
//     },
//   ],
//   companies: [
//     {
//       idCompany: "7654321",
//       certificates: [
//         // DOC Certificates (cTypeCertificate="DOC" is inferred)
//         {
//           cFlag: "GBR",
//           shipType: ["A1", "A2"],
//           dSurvey: "20060102",
//           dNextSurvey: "20110102",
//           statuses: [{ cStatus: "del", dStatus: "20060102" }],
//         },
//       ],
//     },
//   ],
// };

// const finalXML = generateIACSExchangeXML(data);

// console.log(finalXML);
// // In a Node.js environment, you would use fs.writeFileSync to save the file.
// fs.writeFileSync("BV070101.xml", finalXML);
