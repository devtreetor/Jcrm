export async function initiateCall(leadId: string, callerId: string): Promise<void> {
  throw new Error(
    `Not implemented — see integration roadmap. Called with leadId=${leadId}, callerId=${callerId}`
  );
}

export async function getRecording(callId: string): Promise<string> {
  throw new Error(
    `Not implemented — see integration roadmap. Called with callId=${callId}`
  );
}
