import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import {Llaves} from '../config/llaves';
import {Credenciales, Persona} from '../models';
import {PersonaRepository} from '../repositories';
import {AutenticacionService} from '../services';
// Fecha 18 Nov 2021
const fetch = require("node-fetch");

export class PersonaController {
  constructor(
    @repository(PersonaRepository)
    public personaRepository: PersonaRepository,
    // Fecha 18 Nov 2021 - MODIFICACION DE HOY
    @service(AutenticacionService)
    public servicioAutenticacion: AutenticacionService
  ) { }

  // FECHA VIERNES JUEVES 19 NOVIEMBRE 2021
  @post("/identificarPersona", {
    responses:{
      '200':{
        descripcion: "Identificador de usuarios"
      }
    }
  })
  async identificarPersona(
    @requestBody() credenciales: Credenciales
  ) {
    let p = await this.servicioAutenticacion.IdentificarPersona(credenciales.usuario, credenciales.clave)
    if (p){
      let token = this.servicioAutenticacion.GenerarTokenJWT(p);
      return{
        datos:{
          nombre: p.nombres,
          correo: p.correo,
          id: p.id
        },
        tk: token

      }
    }else{
      throw new HttpErrors[401]("Datos invalidos");

    }
  }


  @post('/personas')
  @response(200, {
    description: 'Persona model instance',
    content: {'application/json': {schema: getModelSchemaRef(Persona)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {
            title: 'NewPersona',
            exclude: ['id'],
          }),
        },
      },
    })
    persona: Omit<Persona, 'id'>,
  ): Promise<Persona> {
    // Fecha 18 Nov 2021 - MODIFICACION DE HOY
    //return this.personaRepository.create(persona);

    let clave = this.servicioAutenticacion.GenerarClave();
    let claveCifrada = this.servicioAutenticacion.CifrarClave(clave);
    persona.clave = claveCifrada;
    let p = await this.personaRepository.create(persona);

    // NOTIFICAR al usuario
    let destino = persona.correo;
    let asunto = 'Acaba de Registrarse en la plataforma'
    let contenido = 'Hola ${persona.nomre}, su usuario es ${persona.correo} y su contrasseña es ${clave}';
    // FECHA 19 Noviembre 2021 - se modifica pra poder utilizar la llave de Autenticacion
    //fetch(`http://172.0.0.1:5000/envio-correo?correo_destino=${destino}&asunto=${asunto}&contenido=${contenido}`).then((data: any) => {
    //  console.log(data);
    //})

    fetch(`${Llaves.urlServicoNotificaciones}/envio-correo?correo_destino=${destino}&asunto=${asunto}&contenido=${contenido}`).then((data: any) => {
      console.log(data);
    })
    return p;

  }

  @get('/personas/count')
  @response(200, {
    description: 'Persona model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Persona) where?: Where<Persona>,
  ): Promise<Count> {
    return this.personaRepository.count(where);
  }

  @get('/personas')
  @response(200, {
    description: 'Array of Persona model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Persona, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Persona) filter?: Filter<Persona>,
  ): Promise<Persona[]> {
    return this.personaRepository.find(filter);
  }

  @patch('/personas')
  @response(200, {
    description: 'Persona PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {partial: true}),
        },
      },
    })
    persona: Persona,
    @param.where(Persona) where?: Where<Persona>,
  ): Promise<Count> {
    return this.personaRepository.updateAll(persona, where);
  }

  @get('/personas/{id}')
  @response(200, {
    description: 'Persona model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Persona, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Persona, {exclude: 'where'}) filter?: FilterExcludingWhere<Persona>
  ): Promise<Persona> {
    return this.personaRepository.findById(id, filter);
  }

  @patch('/personas/{id}')
  @response(204, {
    description: 'Persona PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {partial: true}),
        },
      },
    })
    persona: Persona,
  ): Promise<void> {
    await this.personaRepository.updateById(id, persona);
  }

  @put('/personas/{id}')
  @response(204, {
    description: 'Persona PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() persona: Persona,
  ): Promise<void> {
    await this.personaRepository.replaceById(id, persona);
  }

  @del('/personas/{id}')
  @response(204, {
    description: 'Persona DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.personaRepository.deleteById(id);
  }
}
