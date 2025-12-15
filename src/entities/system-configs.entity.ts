import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "./base.entity";

@Index("PK__system_c__3213E83F678547A3", ["id"], { unique: true })
@Index("UQ__system_c__BDF6033D3D43F81A", ["configKey"], { unique: true })
@Entity("system_configs", { schema: "dbo" })
export class SystemConfigs extends BaseEntity{
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "config_key", unique: true, length: 50 })
  configKey: string;

  @Column("nvarchar", { name: "config_value", nullable: true, length: 255 })
  configValue: string | null;

  @Column("nvarchar", { name: "description", nullable: true, length: 255 })
  description: string | null;

}
