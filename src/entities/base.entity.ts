import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, VersionColumn } from "typeorm";

export abstract class BaseEntity {
    @CreateDateColumn({ name: "created_at", select: false })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at", select: false })
    updatedAt: Date;

    @DeleteDateColumn({ name: "deleted_at", select: false })
    deletedAt: Date;

    @Column("int", { name: "created_by", nullable: true, select: false })
    createdBy: number | null;

    @Column("int", { name: "updated_by", nullable: true, select: false })
    updatedBy: number | null;

    @VersionColumn()
    version: number;
}