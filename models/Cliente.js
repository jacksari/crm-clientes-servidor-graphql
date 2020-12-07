const mongoose = require('mongoose');

const ClienteSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    empresa: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    telefono: {
        type: String,
        required: false,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now(),
    },
    estado: {
        type: Boolean,
        default: true
    },
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Usuario'
    }


});

module.exports = mongoose.model('Cliente', ClienteSchema);