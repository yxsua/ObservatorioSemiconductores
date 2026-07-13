const service=require("../services/adminMedia.service");const {successResponse}=require("../utils/apiResponse");
async function list(req,res){return res.json(successResponse(await service.list(req.query),"Medios obtenidos correctamente."));}
async function get(req,res){return res.json(successResponse(await service.get(req.params.id),"Medio obtenido correctamente."));}
async function create(req,res){return res.status(201).json(successResponse(await service.create(req.file,req.body,req.user),"Medio cargado correctamente."));}
async function update(req,res){return res.json(successResponse(await service.update(req.params.id,req.body),"Medio actualizado correctamente."));}
module.exports={list,get,create,update};
