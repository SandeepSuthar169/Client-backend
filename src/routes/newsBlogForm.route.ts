import { Router } from "express";
import upload from "../config/multer";
import { 
    createNewsBlogForm,
    deleteNewsBlog,
    getAllNewsBlog,
    getNewsBlogsById, 
    newsBlogUpdate
} from "../controllers/newsBlogForm.controller"

const route = Router();

route.get("/newsBlog", getAllNewsBlog);                                           // get all 
route.get("/newsBlog/:id", getNewsBlogsById);                                     // get by id
route.post("/newsBlog", upload.single("image_url"), createNewsBlogForm);          // create 
route.put("/newsBlog/:id", upload.single("image_url"), newsBlogUpdate);           // update 
route.delete("/newsBlog/:id",  deleteNewsBlog);                                   // delete 

export default route;