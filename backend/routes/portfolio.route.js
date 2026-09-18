import express from "express";
import prisma from "../lib/db.js";

const router = express.Router();

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user=await prisma.user.findFirst({
      where: {
        username: {
        equals: username,
        mode: 'insensitive',
      },
      },
      select: {
    id: true,
    username: true,
    email: true,
    name:true,
    title:true,
    // add the other fields you want
  },
    });

    // console.log("FETCH portfolio:", username, user);
    if(user){
        return res.status(200).json({
            success: true,
            user: user || null,
          });
    }
    else{
        return res.status(404).json({
            success: false,
            message: "User not found",
          });
    }
}
    catch (error) {
    console.error("FETCH ABOUT ERROR:", error); 
    }
    });

    export default router;
