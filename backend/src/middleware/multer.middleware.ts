import multer from 'multer';

import { Request } from 'express';



// Configurar almacenamiento en memoria (no guardamos archivos en disco)

const storage = multer.memoryStorage();



// Filtrar tipos de archivo permitidos

const fileFilter = (

  _req: Request,

  file: Express.Multer.File,

  cb: multer.FileFilterCallback

) => {

  // Tipos MIME permitidos

  const allowedMimeTypes = [

    'image/jpeg',

    'image/png',

    'image/webp',

  ];



  if (allowedMimeTypes.includes(file.mimetype)) {

    cb(null, true);

  } else {

    cb(new Error('Tipo de archivo no permitido. Solo se permiten JPG, PNG o WEBP.'));

  }

};



// Configurar multer

const upload = multer({

  storage,

  fileFilter,

  limits: {

    fileSize: 5 * 1024 * 1024, // 5MB máximo

    files: 1, // Solo un archivo por solicitud

  },

});



// Middleware para subir una sola imagen

export const uploadSingleImage = upload.single('selfie');



// Middleware para manejar errores de multer

export const handleMulterError = (

  err: any,

  _req: Request,

  res: any,

  next: any

) => {

  if (err instanceof multer.MulterError) {

    // Error de multer

    if (err.code === 'LIMIT_FILE_SIZE') {

      return res.status(400).json({

        error: 'FILE_TOO_LARGE',

        message: 'El archivo no debe superar 5MB',

      });

    }



    if (err.code === 'LIMIT_FILE_COUNT') {

      return res.status(400).json({

        error: 'TOO_MANY_FILES',

        message: 'Solo se permite subir un archivo a la vez',

      });

    }



    return res.status(400).json({

      error: 'UPLOAD_ERROR',

      message: `Error al subir el archivo: ${err.message}`,

    });

  } else if (err) {

    // Otro tipo de error

    if (err.message.includes('Tipo de archivo no permitido')) {

      return res.status(400).json({

        error: 'INVALID_FILE_TYPE',

        message: 'Solo se permiten archivos JPG, PNG o WEBP',

      });

    }



    return res.status(400).json({

      error: 'VALIDATION_ERROR',

      message: err.message,

    });

  }



  next();

};