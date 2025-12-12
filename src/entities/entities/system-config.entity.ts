import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Index("PK__SystemCo__C41E028819221E25", ["key"], { unique: true })
@Entity("SystemConfig", { schema: "dbo" })
export class SystemConfig extends BaseEntity {
  @Column("varchar", { primary: true, name: "Key", length: 50 })
  key: string;

  @Column("nvarchar", { name: "Value", nullable: true, length: 255 })
  value: string | null;

  @Column("nvarchar", { name: "Description", nullable: true, length: 255 })
  description: string | null;
}
