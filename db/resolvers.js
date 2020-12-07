const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: '.env' });

const crearToken = (usuario, secreta, expiracion) => {
    //console.log(usuario);
    const { id, email, nombre, apellido, tipo } = usuario
    return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn: expiracion });
}


const resolvers = {
    Query: {
        obtenerUsuario: async(_, { token }) => {
            const usuarioId = jwt.verify(token, process.env.SECRETA)

            return usuarioId;
        },
        obtenerProductos: async() => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerProducto: async(_, { id }) => {
            //Revisar si el producto existe
            const existeProducto = await Producto.findById(id);
            if (!existeProducto) {
                throw new Error('Producto no encontrado');
            }
            return existeProducto;
        },
        obtenerClientes: async() => {
            try {
                const clientes = await Cliente.find();
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerClientesVendedor: async(_, {}, ctx) => {
            console.log(ctx);
            try {
                const clientes = await Cliente.find({ vendedor: ctx.usuario.id.toString() });
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerCliente: async(_, { id }, ctx) => {
            const cliente = await Cliente.findById({ id });
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales')
            }
            return cliente;
        },
        obtenerPedidos: async() => {
            try {
                const pedidos = await Pedido.find();
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedidosVendedor: async(_, {}, ctx) => {
            try {
                const pedidos = await Pedido.find({ vendedor: ctx.usuario.id });
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedido: async(_, { id }, ctx) => {
            //Si el pedido existe o no
            const pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('Pedido no encont5ado');
            }
            //Solo quien lo creo puede verlo
            if (pedido.vendedor.toString !== ctx.usuario.id) {
                throw new Error('Acción no permitida');
            }
            //Retornar el resultado
            return pedido;
        },
        obtenerPedidosEstado: async(_, { estado }, ctx) => {
            const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado });

            return pedidos;
        },
        mejoresClientes: async() => {
            const clientes = await Pedido.aggregate([
                { $match: { estado: "COMPLETADO" } },
                {
                    $group: {
                        _id: "$cliente",
                        total: { $sum: '$total' }
                    }
                },
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: "_id",
                        as: 'cliente'
                    }
                },
                {
                    $limit: 3,
                },
                {
                    $sort: { total: -1 }
                }
            ]);
            return clientes;
        },
        mejoresVendedores: async() => {
            const vendedores = await Pedido.aggregate([
                { $match: { estado: 'COMPLETADO' } },
                {
                    $group: {
                        _id: "$vendedor",
                        total: { $sum: '$total' }
                    }
                },
                {
                    $lookup: {
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: "_id",
                        as: 'vendedor'
                    }
                },
                {
                    $limit: 3,
                },
                {
                    $sort: { total: -1 }
                }
            ]);
            return vendedores;
        },
        buscarProducto: async(_, { text }) => {
            const productos = await Producto.find({ $text: { $search: text } }).limit(10);
            return productos;
        }
    },
    Mutation: {
        nuevoUsuario: async(_, { input }) => {
            const { email, password } = input;
            //Revisar si el usuario ya está registrado
            const existeUsuario = await Usuario.findOne({ email });
            if (existeUsuario) {
                throw new Error('El usuario ya está registrado');
            }

            //Hash del password
            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);

            //Guardar en la base de datos
            try {
                const usuario = new Usuario(input);
                usuario.save();
                return usuario;
            } catch (error) {
                console.log(error);
            }

        },
        autenticarUsuario: async(_, { input }) => {
            const { email, password } = input;
            //Si el usuario existe
            const existeUsuario = await Usuario.findOne({ email });
            //console.log(existeUsuario);
            if (!existeUsuario) {
                throw new Error('El usuario no existe');
            }
            //Contraseña mala
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
            if (!passwordCorrecto) {
                throw new Error('El password es incorrecto');
            }
            //Crear el token
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '24h')
            }
        },
        nuevoProducto: async(_, { input }) => {
            try {
                const pro = new Producto(input);

                const res = await pro.save();
                return res;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProducto: async(_, { id, input }) => {
            let existeProducto = await Producto.findById(id);
            if (!existeProducto) {
                throw new Error('Producto no encontrado');
            }
            existeProducto = await Producto.findOneAndUpdate({ _id: id }, input, { new: true });
            return existeProducto;
        },
        eliminarProducto: async(_, { id }) => {
            let existeProducto = await Producto.findById(id);
            if (!existeProducto) {
                throw new Error('Producto no encontrado');
            }
            await Producto.findByIdAndDelete({ _id: id });
            return `El producto: ${existeProducto.nombre} fue eliminado`;
        },
        nuevoCliente: async(_, { input }, ctx) => {
            const { email } = input;
            //Verificar si el cliente ya está registrado
            //console.log(input);
            const existeCliente = await Cliente.findOne({ email });
            if (existeCliente) {
                throw new Error('Ese cliente ya está registrado');
            }
            //Asignar vendedor
            const nuevoCliente = new Cliente(input);
            nuevoCliente.vendedor = ctx.usuario.id;
            try {
                //Guardar en la base de datos

                const res = await nuevoCliente.save();
                return res;
            } catch (error) {
                console.log(erro);
            }
        },
        actualizarCliente: async(_, { id, input }, ctx) => {
            //Verificar si existe o no
            const existeCliente = await Cliente.findById({ id });
            if (!existeCliente) {
                throw new Error('Ese cliente no existe en la base de datos');
            }
            //Verificar si el cliente es quien edita
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales')
            }
            //Guardar cliente
            cliente = await Cliente.findOneAndUpdate({ _id: id }, input, { new: true });
            return cliente;
        },
        eliminarCliente: async(_, { id }, ctx) => {
            //Verificar si existe o no
            const existeCliente = await Cliente.findById({ id });
            if (!existeCliente) {
                throw new Error('Ese cliente no existe en la base de datos');
            }
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales')
            }
            await Cliente.findOneAndDelete({ _id: id });
            return "Cliente eliminado";
        },
        nuevoPedido: async(_, { input }, ctx) => {
            //console.log(ctx.usuario);
            const { cliente } = input;
            //Verificar si el cliente existe o no
            //console.log(cliente);
            const existeCliente = await Cliente.findById(cliente);

            if (!existeCliente) {
                throw new Error('Ese cliente no existe en la base de datos');
            }
            //Verificar si el cliente es del vendedor
            //Verificar si el cliente es quien edita
            //console.log(`${existeCliente.vendedor} - ${ctx.usuario.id}`);
            if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales')
            }
            //Revisar si el stock está disponible
            for await (const articulo of input.pedido) {
                // console.log(articulo);
                const { id } = articulo;
                const producto = await Producto.findById(id);
                if (articulo.cantidad > producto.existencia) {
                    throw new Error(`El artículo ${producto.nombre} excede la cantidad disponible`);
                } else {
                    //Restar la cantidad
                    producto.existencia = producto.existencia - articulo.cantidad;
                    await producto.save();
                }
            }
            //Crear un nuevo pedido
            const nuevoPedido = new Pedido(input);
            //Asignar un vendedor
            nuevoPedido.vendedor = ctx.usuario.id;
            //Guardar en la base de datos
            const respuesta = await nuevoPedido.save();
            return respuesta;
        },
        actualizarPedido: async(_, { id, input }, ctx) => {
            const { cliente } = input;
            //Verificar si el pedido existe
            const pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('Pedido no encontrado');
            }
            //Verificar si el cliente existe
            const existeCliente = await Cliente.findById(cliente);
            if (!existeCliente) {
                throw new Error('Cliente no encontrado');
            }
            //Si el cliente y pedido pertence al vendedor
            if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('Acción no permitida');
            }
            //Revisar stock
            if (input.pedido) {
                for await (const articulo of input.pedido) {
                    // console.log(articulo);
                    const { id } = articulo;
                    const producto = await Producto.findById(id);
                    if (articulo.cantidad > producto.existencia) {
                        throw new Error(`El artículo ${producto.nombre} excede la cantidad disponible`);
                    } else {
                        //Restar la cantidad
                        producto.existencia = producto.existencia - articulo.cantidad;
                        await producto.save();
                    }
                }
            }
            //Guardar
            const resp = await Pedido.findByIdAndUpdate({ _id: id }, input, { new: true });
            return resp;
        },
        eliminarPedido: async(_, { id }, ctx) => {
            //Verfificar si el pedido existe o no 
            const pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('Pedido no existe');
            }
            if (pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('Acción no permitida');
            }
            await Pedido.findByIdAndDelete({ _id: id });
            return 'Pedido eliminado';

        }
    }
}

module.exports = resolvers;