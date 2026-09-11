const express = require("express");

const {
    register,
    login,
    getProfile
} = require("../controllers/auth.controller");

const {
    authenticate
} = require("../middleware/auth.middleware");

const {
    asyncHandler
} = require("../utils/asyncHandler");

const router = express.Router();

router.post(
    "/register",
    asyncHandler(register)
);

router.post(
    "/login",
    asyncHandler(login)
);

router.get(
    "/me",
    authenticate,
    asyncHandler(getProfile)
);

const recovery=require('../services/password-recovery.service').createRecoveryService({repo:require('../repositories/password-recovery.repository'),mail:require('../services/recovery-mail')});
const {successResponse}=require('../utils/apiResponse');
router.use('/password',(_req,res,next)=>{res.set('Cache-Control','no-store');next();});
router.get('/password/status',(_req,res)=>res.json(successResponse({available:recovery.available()})));
router.post('/password/forgot',asyncHandler(async(req,res)=>{await recovery.request(req.body,req.ip);res.json(successResponse(null,'Si existe una cuenta activa con ese correo, recibirás un enlace de recuperación. Revisa también la carpeta de spam.'));}));
router.post('/password/reset',asyncHandler(async(req,res)=>{await recovery.reset(req.body,req.ip);res.json(successResponse(null,'Contraseña actualizada. Inicia sesión con tu nueva contraseña.'));}));
module.exports = router;