function getIssuerId(vc) {
  return typeof vc.issuer === "string" ? vc.issuer : vc.issuer?.id || "";
}

function getVCType(vc) {
  if (Array.isArray(vc.type)) {
    if (vc.type.includes("AcademicCertificate")) return "AcademicCertificate";
    if (vc.type.includes("StudentID")) return "StudentID";
  }
  const subject = vc.credentialSubject || {};
  if (subject.registerNumber || subject.degree || subject.cgpa) {
    return "AcademicCertificate";
  }
  return "StudentID";
}

function getFieldMapping(vc) {
  return getVCType(vc) === "AcademicCertificate"
    ? {
        name: { index: 0, value: vc.credentialSubject?.name },
        registerNumber: { index: 1, value: vc.credentialSubject?.registerNumber },
        degree: { index: 2, value: vc.credentialSubject?.degree },
        branch: { index: 3, value: vc.credentialSubject?.branch },
        university: { index: 4, value: vc.credentialSubject?.university },
        location: { index: 5, value: vc.credentialSubject?.location },
        cgpa: { index: 6, value: vc.credentialSubject?.cgpa },
        class: { index: 7, value: vc.credentialSubject?.class },
        examHeldIn: { index: 8, value: vc.credentialSubject?.examHeldIn },
        issuedDate: { index: 9, value: vc.credentialSubject?.issuedDate },
        id: { index: 10, value: vc.credentialSubject?.id },
        issuer: { index: 11, value: getIssuerId(vc) },
        issuanceDate: { index: 12, value: vc.issuanceDate },
        documentHash: { index: 13, value: vc.credentialSubject?.documentHash }
      }
    : {
        name: { index: 0, value: vc.credentialSubject?.name },
        rollNumber: { index: 1, value: vc.credentialSubject?.rollNumber },
        dateOfBirth: { index: 2, value: vc.credentialSubject?.dateOfBirth },
        department: { index: 3, value: vc.credentialSubject?.department },
        id: { index: 4, value: vc.credentialSubject?.id },
        issuer: { index: 5, value: getIssuerId(vc) },
        issuanceDate: { index: 6, value: vc.issuanceDate },
        documentHash: { index: 7, value: vc.credentialSubject?.documentHash }
      };
}

function getAllMessages(vc) {
  const mapping = getFieldMapping(vc);
  return Object.values(mapping)
    .sort((a, b) => a.index - b.index)
    .map(entry => entry.value);
}

function getDisclosedProofMessages(vc, disclosedFields) {
  const mapping = getFieldMapping(vc);
  const fields = [...new Set(disclosedFields || [])];
  const disclosed = fields
    .map(field => ({ field, entry: mapping[field] }))
    .filter(item => item.entry && item.entry.value !== undefined && item.entry.value !== null)
    .sort((a, b) => a.entry.index - b.entry.index);

  return {
    disclosedFields: disclosed.map(item => item.field),
    disclosedIndexes: disclosed.map(item => item.entry.index),
    disclosedMessages: disclosed.map(item => item.entry.value)
  };
}

function encodeMessages(messages) {
  const encoder = new TextEncoder();
  return messages.map(message => encoder.encode(String(message || "")));
}

module.exports = {
  getVCType,
  getIssuerId,
  getFieldMapping,
  getAllMessages,
  getDisclosedProofMessages,
  encodeMessages
};
