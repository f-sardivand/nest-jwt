import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) protected readonly userRepositoty:Repository<User>){}

    async save(body){
        return this.userRepositoty.save(body)
    }

    async findOne(options){
        return this.userRepositoty.findOneBy(options)
    }
}
