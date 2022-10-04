import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose/dist';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ) { }

  private searchType = (search: string | number): string => {
    let type: string = 'invalid'
    if(isValidObjectId(search)) return 'id'
    if(!isNaN(Number(search))) return 'number'
    if(isNaN(Number(search))) return 'name'
    return type
  }

  private handleExceptions = (error: any) => {
    if(error.code === 11000) {
      throw new BadRequestException(`Pokemon already exists. ${ JSON.stringify(error.keyValue) }`);
    }
    throw new InternalServerErrorException(`Can't create Pokemon: ${ error }`);
  }

  public create = async (createPokemonDto: CreatePokemonDto) => {
    try {
      createPokemonDto.name = createPokemonDto.name.toLowerCase();
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  findAll() {
    return `This action returns all pokemon`;
  }

  public findOne = async (search: string) => {
    let pokemon: Pokemon;
    const searchTypeResponse = this.searchType(search)
    try {
      switch (searchTypeResponse) {
        case 'id':
          pokemon = await this.pokemonModel.findById(search)
          break;
        case 'number':
          pokemon = await this.pokemonModel.findOne({ no: search })
          break;
        case 'name':
          pokemon = await this.pokemonModel.findOne({ name: search.toLocaleLowerCase() })
          break;
        default:
          pokemon = null;
          break;
      }
    } catch (error) {
      this.handleExceptions(error)
    }
    if(!pokemon) throw new NotFoundException(`Pokemon with ${ searchTypeResponse } "${ search }" not found.`)
    return pokemon;
  }

  public update = async (search: string, updatePokemonDto: UpdatePokemonDto) => {
    const pokemon = await this.findOne(search)
    if(updatePokemonDto.name) updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase()
    try {
      await pokemon.updateOne(updatePokemonDto)
      return { ...pokemon.toJSON(), ...updatePokemonDto }
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  public remove = async (id: string) => {
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id })
    if(deletedCount === 0)
      throw new NotFoundException(`Pokemon with id "${ id }" not found.`)
    return
  }
}
