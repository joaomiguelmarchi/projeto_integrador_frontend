import { BinaryReader, BinaryWriter } from 'google-protobuf'

export class PatientDetailsRequest {
  private id = 0

  getId() {
    return this.id
  }

  setId(value: number) {
    this.id = value
  }

  serializeBinary() {
    const writer = new BinaryWriter()
    PatientDetailsRequest.serializeBinaryToWriter(this, writer)
    return writer.getResultBuffer()
  }

  static serializeBinaryToWriter(message: PatientDetailsRequest, writer: BinaryWriter) {
    if (message.id !== 0) {
      writer.writeInt32(1, message.id)
    }
  }

  static deserializeBinary(bytes: Uint8Array) {
    const reader = new BinaryReader(bytes)
    const message = new PatientDetailsRequest()
    return PatientDetailsRequest.deserializeBinaryFromReader(message, reader)
  }

  static deserializeBinaryFromReader(message: PatientDetailsRequest, reader: BinaryReader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break

      if (reader.getFieldNumber() === 1) {
        message.setId(reader.readInt32())
      } else {
        reader.skipField()
      }
    }

    return message
  }
}

export class Patient {
  private id = 0
  private name = ''
  private email = ''
  private birthday = ''
  private age = 0
  private sex = ''
  private responsible = ''
  private document = ''
  private address = ''
  private addressesNumber = ''
  private homePhoneNumber = ''
  private commercialPhoneNumber = ''
  private phoneNumber = ''
  private occupation = ''

  getId() {
    return this.id
  }

  setId(value: number) {
    this.id = value
  }

  getName() {
    return this.name
  }

  setName(value: string) {
    this.name = value
  }

  getEmail() {
    return this.email
  }

  setEmail(value: string) {
    this.email = value
  }

  getBirthday() {
    return this.birthday
  }

  setBirthday(value: string) {
    this.birthday = value
  }

  getAge() {
    return this.age
  }

  setAge(value: number) {
    this.age = value
  }

  getSex() {
    return this.sex
  }

  setSex(value: string) {
    this.sex = value
  }

  getDocument() {
    return this.document
  }

  setDocument(value: string) {
    this.document = value
  }

  getResponsible() {
    return this.responsible
  }

  setResponsible(value: string) {
    this.responsible = value
  }

  getAddress() {
    return this.address
  }

  setAddress(value: string) {
    this.address = value
  }

  getAddressesNumber() {
    return this.addressesNumber
  }

  setAddressesNumber(value: string) {
    this.addressesNumber = value
  }

  getHomePhoneNumber() {
    return this.homePhoneNumber
  }

  setHomePhoneNumber(value: string) {
    this.homePhoneNumber = value
  }

  getCommercialPhoneNumber() {
    return this.commercialPhoneNumber
  }

  setCommercialPhoneNumber(value: string) {
    this.commercialPhoneNumber = value
  }

  getPhoneNumber() {
    return this.phoneNumber
  }

  setPhoneNumber(value: string) {
    this.phoneNumber = value
  }

  getOccupation() {
    return this.occupation
  }

  setOccupation(value: string) {
    this.occupation = value
  }

  serializeBinary() {
    const writer = new BinaryWriter()
    Patient.serializeBinaryToWriter(this, writer)
    return writer.getResultBuffer()
  }

  static serializeBinaryToWriter(message: Patient, writer: BinaryWriter) {
    if (message.id !== 0) writer.writeInt32(1, message.id)
    if (message.name.length > 0) writer.writeString(2, message.name)
    if (message.email.length > 0) writer.writeString(3, message.email)
    if (message.birthday.length > 0) writer.writeString(4, message.birthday)
    if (message.age !== 0) writer.writeInt32(5, message.age)
    if (message.sex.length > 0) writer.writeString(6, message.sex)
    if (message.responsible.length > 0) writer.writeString(7, message.responsible)
    if (message.document.length > 0) writer.writeString(8, message.document)
    if (message.address.length > 0) writer.writeString(9, message.address)
    if (message.addressesNumber.length > 0) writer.writeString(10, message.addressesNumber)
    if (message.homePhoneNumber.length > 0) writer.writeString(11, message.homePhoneNumber)
    if (message.commercialPhoneNumber.length > 0) writer.writeString(12, message.commercialPhoneNumber)
    if (message.phoneNumber.length > 0) writer.writeString(13, message.phoneNumber)
    if (message.occupation.length > 0) writer.writeString(14, message.occupation)
  }

  static deserializeBinary(bytes: Uint8Array) {
    const reader = new BinaryReader(bytes)
    const message = new Patient()
    return Patient.deserializeBinaryFromReader(message, reader)
  }

  static deserializeBinaryFromReader(message: Patient, reader: BinaryReader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break

      switch (reader.getFieldNumber()) {
        case 1:
          message.setId(reader.readInt32())
          break
        case 2:
          message.setName(reader.readString())
          break
        case 3:
          message.setEmail(reader.readString())
          break
        case 4:
          message.setBirthday(reader.readString())
          break
        case 5:
          message.setAge(reader.readInt32())
          break
        case 6:
          message.setSex(reader.readString())
          break
        case 7:
          message.setResponsible(reader.readString())
          break
        case 8:
          message.setDocument(reader.readString())
          break
        case 9:
          message.setAddress(reader.readString())
          break
        case 10:
          message.setAddressesNumber(reader.readString())
          break
        case 11:
          message.setHomePhoneNumber(reader.readString())
          break
        case 12:
          message.setCommercialPhoneNumber(reader.readString())
          break
        case 13:
          message.setPhoneNumber(reader.readString())
          break
        case 14:
          message.setOccupation(reader.readString())
          break
        default:
          reader.skipField()
      }
    }

    return message
  }
}

export class PatientDetailsResponse {
  private success = false
  private errorMessage = ''
  private patient?: Patient

  getSuccess() {
    return this.success
  }

  setSuccess(value: boolean) {
    this.success = value
  }

  getErrorMessage() {
    return this.errorMessage
  }

  setErrorMessage(value: string) {
    this.errorMessage = value
  }

  getPatient() {
    return this.patient
  }

  setPatient(value?: Patient) {
    this.patient = value
  }

  serializeBinary() {
    const writer = new BinaryWriter()
    PatientDetailsResponse.serializeBinaryToWriter(this, writer)
    return writer.getResultBuffer()
  }

  static serializeBinaryToWriter(message: PatientDetailsResponse, writer: BinaryWriter) {
    if (message.success) writer.writeBool(1, message.success)
    if (message.patient) {
      writer.writeMessage(2, message.patient, Patient.serializeBinaryToWriter)
    }
    if (message.errorMessage.length > 0) writer.writeString(4, message.errorMessage)
  }

  static deserializeBinary(bytes: Uint8Array) {
    const reader = new BinaryReader(bytes)
    const message = new PatientDetailsResponse()
    return PatientDetailsResponse.deserializeBinaryFromReader(message, reader)
  }

  static deserializeBinaryFromReader(message: PatientDetailsResponse, reader: BinaryReader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break

      switch (reader.getFieldNumber()) {
        case 1:
          message.setSuccess(reader.readBool())
          break
        case 2: {
          const patient = new Patient()
          reader.readMessage(patient, Patient.deserializeBinaryFromReader)
          message.setPatient(patient)
          break
        }
        case 4:
          message.setErrorMessage(reader.readString())
          break
        default:
          reader.skipField()
      }
    }

    return message
  }
}
