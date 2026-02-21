const mongoose = require("mongoose");
const feeDeTailsSchemma = new mongoose.Schema(
  {
    tuitionFee: {
      type: Number,
      required: true,
    },
    admissionFee: {
      type: Number,
      default: 0,
    },
    registrationFee: {
      type: Number,
      default: 0,
    },
    examinationFee: {
      type: Number,
      default: 0,
    },
    libraryFee: {
      type: Number,
      default: 0,
    },
    laboratoryFee: {
      type: Number,
      default: 0,
    },
    sportsFee: {
      type: Number,
      default: 0,
    },
    computerFee: {
      type: Number,
      default: 0,
    },
    transportFee: {
      type: Number,
      default: 0,
    },
    hostelFee: {
      type: Number,
      default: 0,
    },
    securityFee: {
      type: Number,
      default: 0,
    },
    maintenanceFee: {
      type: Number,
      default: 0,
    },
    developmentFee: {
      type: Number,
      default: 0,
    },
    alumniAssociationFee: {
      type: Number,
      default: 0,
    },
    clubActivityFee: {
      type: Number,
      default: 0,
    },
    finePenaltyCharges: {
      type: Number,
      default: 0,
    },
    identityCardFee: {
      type: Number,
      default: 0,
    },
    insuranceFee: {
      type: Number,
      default: 0,
    },
    stationaryFee: {
      type: Number,
      default: 0,
    },
    technologyFee: {
      type: Number,
      default: 0,
    },
    medicalFee: {
      type: Number,
      default: 0,
    },
    counselingFee: {
      type: Number,
      default: 0,
    },
    workshopTrainingFee: {
      type: Number,
      default: 0,
    },
    certificationFee: {
      type: Number,
      default: 0,
    },
    scholarshipFund: {
      type: Number,
      default: 0,
    },
    culturalEventFee: {
      type: Number,
      default: 0,
    },
    researchFund: {
      type: Number,
      default: 0,
    },
    buildingFund: {
      type: Number,
      default: 0,
    },
    greenInitiativeFee: {
      type: Number,
      default: 0,
    },
    graduationFee: {
      type: Number,
      default: 0,
    },
    internationalStudentFee: {
      type: Number,
      default: 0,
    },
    examRetakeFee: {
      type: Number,
      default: 0,
    },
    lateSubmissionFee: {
      type: Number,
      default: 0,
    },
    transcriptFee: {
      type: Number,
      default: 0,
    },
    fieldTripFee: {
      type: Number,
      default: 0,
    },
    uniformFee: {
      type: Number,
      default: 0,
    },
    mealPlanFee: {
      type: Number,
      default: 0,
    },
    socialWelfareFund: {
      type: Number,
      default: 0,
    },
    studentUnionFee: {
      type: Number,
      default: 0,
    },
    academicSupportFee: {
      type: Number,
      default: 0,
    },
    assessmentFee: {
      type: Number,
      default: 0,
    },
    equipmentFee: {
      type: Number,
      default: 0,
    },
    distanceLearningFee: {
      type: Number,
      default: 0,
    },
    languageProficiencyTestFee: {
      type: Number,
      default: 0,
    },
    studyAbroadFee: {
      type: Number,
      default: 0,
    },
    internshipPlacementFee: {
      type: Number,
      default: 0,
    },
    technologyUpgradeFee: {
      type: Number,
      default: 0,
    },
    artMusicDanceFee: {
      type: Number,
      default: 0,
    },
    careerServicesFee: {
      type: Number,
      default: 0,
    },
    alumniNetworkFee: {
      type: Number,
      default: 0,
    },
    healthWellnessFee: {
      type: Number,
      default: 0,
    },
    feeLeft: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    bankName: {
      type: String,
    },
    bankLogo: {
      type: String,
    },
    specialInstruction: {
      type: String,
    },
  },
  { timestamps: true }
);

feeDeTailsSchemma.statics.addFeeDetails = async function (data) {
  // const studentId = studentId;
  // console.log(studentId);
  const newFeeDetails = new FeeDetails(data);
  await newFeeDetails.save();
  return newFeeDetails;
};

const FeeDetails = mongoose.model("FeeDetails", feeDeTailsSchemma);
module.exports = FeeDetails;
