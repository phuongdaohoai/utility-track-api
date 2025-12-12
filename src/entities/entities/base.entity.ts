import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseEntity{
    @CreateDateColumn({type:'datetime',name:'createdAt'})
    createdAt:Date;

    @UpdateDateColumn({type:'datetime',name:'updatedAt'})
    updatedAt:Date;

    @DeleteDateColumn({type:'datetime',name:'deletedAt'})
    deletedAt:Date;

    @Column({nullable:true})
    createdBy:number;

    @Column({nullable:true})
    updatedBy:number;
}