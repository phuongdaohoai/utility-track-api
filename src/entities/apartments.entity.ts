import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Residents } from "./residents.entity";
import { BaseEntity } from "./base.entity";

@Index("PK__apartmen__3213E83F49192709", ["id"], { unique: true })
@Entity("apartments", { schema: "dbo" })
export class Apartments extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "building", length: 50 })
  building: string;

  @Column("varchar", { name: "room_number", length: 20 })
  roomNumber: string;

  @Column("int", { name: "floor_number", nullable: true })
  floorNumber: number | null;

  @OneToMany(() => Residents, (residents) => residents.apartment)
  residents: Residents[];
}
