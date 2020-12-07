const mongoose = require('mongoose');

const ClienteSchema = mongoose.Schema({
    pedido: {
        type: Array,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Cliente'
    },
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Usuario'
    },
    creado: {
        type: Date,
        default: Date.now(),
    },
    estado: {
        type: String,
        default: "PENDIENTE"
    }


});

module.exports = mongoose.model('Pedido', ClienteSchema);