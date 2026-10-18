import { Router } from "express";
import upload from "../config/multer"; 
import { 
    createEvent, 
    getEventById, 
    getAllEvents, 
    eventUpdate,
    deleteEvent
} from "../controllers/envetForm.controller";

const router = Router();

router.get("/events/", getAllEvents);                                   // get All events
router.get("/events/:id", getEventById);                                // get event by id
router.post("/events", upload.single("image_url"), createEvent);        // create event
router.put("/events/:id", upload.single("image_url"), eventUpdate);     // update event
router.delete("/events/:id", deleteEvent);                              // delete event


export default router;