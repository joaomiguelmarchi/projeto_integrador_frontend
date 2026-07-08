import * as grpcWeb from 'grpc-web'
import { PatientDetailsRequest, PatientDetailsResponse } from './patient_details_pb'

const methodDescriptorPatientServiceGetPatientDetails = new grpcWeb.MethodDescriptor(
  '/patient_details.PatientService/GetPatientDetails',
  grpcWeb.MethodType.UNARY,
  PatientDetailsRequest,
  PatientDetailsResponse,
  (request: PatientDetailsRequest) => request.serializeBinary(),
  PatientDetailsResponse.deserializeBinary
)

export class PatientServiceClient {
  private client = new grpcWeb.GrpcWebClientBase({
    suppressCorsPreflight: true,
    withCredentials: true
  })
  private hostname: string

  constructor(hostname: string) {
    this.hostname = hostname.replace(/\/$/, '')
  }

  getPatientDetails(
    request: PatientDetailsRequest,
    metadata: grpcWeb.Metadata,
    callback: (err: grpcWeb.RpcError, response: PatientDetailsResponse) => void
  ) {
    return this.client.rpcCall(
      `${this.hostname}/patient_details.PatientService/GetPatientDetails`,
      request,
      metadata,
      methodDescriptorPatientServiceGetPatientDetails,
      callback
    )
  }
}
