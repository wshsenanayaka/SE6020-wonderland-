import {
  allTicketPasses,
  createTicketPass,
  deleteTicketPass,
  updateTicketPass,
} from '../services/ticketPassService.js';

export async function listTicketPasses(request, response) {
  response.json({ success: true, ticketPasses: await allTicketPasses() });
}

export async function createTicketPassController(request, response) {
  if (!isAdmin(request)) {
    return response.status(403).json({ success: false, message: 'Administrator login required.' });
  }

  const ticketPass = await createTicketPass(request.body);
  if (!ticketPass) {
    return response.status(422).json({ success: false, message: 'Please fill all required ticket pass fields.' });
  }

  return response.json({ success: true, message: 'Ticket pass inserted successfully.', ticketPass });
}

export async function updateTicketPassController(request, response) {
  if (!isAdmin(request)) {
    return response.status(403).json({ success: false, message: 'Administrator login required.' });
  }

  const ticketPass = await updateTicketPass(request.params.id, request.body);
  if (ticketPass === null) {
    return response.status(404).json({ success: false, message: 'Ticket pass not found.' });
  }
  if (ticketPass === false) {
    return response.status(422).json({ success: false, message: 'Please fill all required ticket pass fields.' });
  }

  return response.json({ success: true, message: 'Ticket pass updated successfully.', ticketPass });
}

export async function deleteTicketPassController(request, response) {
  if (!isAdmin(request)) {
    return response.status(403).json({ success: false, message: 'Administrator login required.' });
  }

  const deleted = await deleteTicketPass(request.params.id);
  if (!deleted) {
    return response.status(404).json({ success: false, message: 'Ticket pass not found.' });
  }

  return response.json({ success: true, message: 'Ticket pass deleted successfully.' });
}

function isAdmin(request) {
  return (request.cookies.wonderland_profile_type || '') === 'admin';
}
