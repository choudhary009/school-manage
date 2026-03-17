const mongoose=require("mongoose")
const schoolDetailsSchema=new mongoose.Schema({
  name: String,
  address: String,
  phoneNumber: String,
  email: String,
  faxNumber: String,
  principalName: String,
  principalEmail: String,
  principalPhone: String,
  logo: String,
  missionStatement: String,
  visionStatement: String,
  type: String,
  accreditation: String,
  facilities: String,
  timings: String,
  extracurricularActivities: String,
  policies: String,
  principal:{
    type:mongoose.Types.ObjectId,
    ref:"admin",
    required:true
  }
})

schoolDetailsSchema.statics.create=async function(body){
  const newSchoolDetails=new SchoolDetails(body)
  await  newSchoolDetails.save()
  return newSchoolDetails;
}



const SchoolDetails=mongoose.model('SchoolDetails',schoolDetailsSchema)
module.exports = SchoolDetails;