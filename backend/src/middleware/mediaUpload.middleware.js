const multer=require("multer");
const {ValidationError}=require("../errors/apiError");

const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:Number(process.env.MEDIA_MAX_BYTES)||20*1024*1024,files:1,fields:8},fileFilter(req,file,callback){const allowed=new Set(["image/avif","image/gif","image/jpeg","image/png","image/webp","application/pdf","text/plain","text/csv","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);callback(allowed.has(file.mimetype)?null:new ValidationError("El tipo de archivo no está permitido."),allowed.has(file.mimetype));}}).single("file");

function mediaUpload(req,res,next){upload(req,res,(error)=>{if(!error)return next();if(error instanceof multer.MulterError)return next(new ValidationError(error.code==="LIMIT_FILE_SIZE"?"El archivo supera el límite permitido.":"La carga del archivo no es válida."));return next(error);});}
module.exports={mediaUpload};
