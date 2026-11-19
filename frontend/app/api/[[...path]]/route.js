import { dispatch } from "../../../../backend/routes.js";

export const runtime = "nodejs";

export function GET(req) {
  return dispatch("GET", req);
}

export function POST(req) {
  return dispatch("POST", req);
}

export function PATCH(req) {
  return dispatch("PATCH", req);
}

export function PUT(req) {
  return dispatch("PUT", req);
}

export function DELETE(req) {
  return dispatch("DELETE", req);
}
