const mongoose = require('mongoose');

const UsuarioSchema = mongoose.Schema({
    nombre: {
        type: String,
        require: true,
        trim: true
    },
    apellido: {
        type: String,
        require: true,
        trim: true
    },
    email: {
        type: String,
        require: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        require: true,
        trim: true
    },
    tipo: {
        type: String,
        require: true,
    },
    creado: {
        type: Date,
        default: Date.now(),
    },
    estado: {
        type: Boolean
    }


});

module.exports = mongoose.model('Usuario', UsuarioSchema);