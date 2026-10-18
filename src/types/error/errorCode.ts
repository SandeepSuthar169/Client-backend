export const ErrorCodes = {
  // Auth
  VALIDATION_FAILED:           { status: 400, message: "Validation failed" },
  INVALID_JSON:                { status: 400, message: "Malformed JSON body" },
  UPDATE_TITLE_ERROR:          { status: 400, message: "Title cannot be empty" },
  PASSWORD_ERROR:              { status: 400, message: "IPassword al least greather than 6 charecter!" },
  UPDATE_TICKETS_ERROR:        { status: 400, message: "Tickects cannot be empty" },
  UPDATE_EVENT_DATE_ERROR:     { status: 400, message: "Event date cannot be empty" },
  UPDATE_TICKETS_TYPES_ERROR:  { status: 400, message: "Event types cannot be empty" },
  
  INVALID_CREDENTIALS:   { status: 401, message: "Invalid email or password" },
  USER_ID_ERROR:         { status: 401, message: "User Id is required!" },
  
  USER_NOT_FOUND:        { status: 404, message: "User not found" },
  
  ADMIN_ERROR:           { status: 403, message: "Forbidden: admin access only" },
  
  INTERNAL_SERVER_ERROR: { status: 500, message: "Internal server error" },
  LOGOUT_ERROR:          { status: 500, message: "Logout failed" },
// -----------------------------------------------------------------------------------------
  // Event form 
  EVENT_ID_ERROR:        { status: 400, message: "Event Id is required" },
  TITLE_ERROR:           { status: 400, message: "Title is required" },
  TICKETS_TYPE_ERROR:    { status: 400, message: "A valid ticket type is required" },
  DATE_ERROR:            { status: 400, message: "A valid event date is required" },
  TICKECTS_ERROR:        { status: 400, message: "Tickets must be a positive integer" },
  IMAGE_ERROR:           { status: 400, message: "Event image is required" },
  UPLOAD_ERROR:          { status: 400, message: "Uploaded file must be an image" },

  RESLUT_ERROR:    { status: 404, message: "result is required!" },

  IMAGE_UPLOAD_ERROR:    { status: 502, message: "Image upload failed" },
  EVENT_NOT_FOUND:       { status: 400, message: "Event not found" },
  LOCATION_ERROR:       { status: 400, message: "Location not found" },
  // -----------------------------------------------------------------------------------------
  NEWS_ID_ERROR:       { status: 400, message: "NEWS  id is required!" },
  NEWS_NOT_FOUND:      { status: 400, message: "NEWS  is required!" },





  
} as const satisfies Record<string, { status: number; message: string }>;


export type ErrorCode = keyof typeof ErrorCodes;