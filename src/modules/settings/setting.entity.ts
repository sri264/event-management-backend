import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryColumn({ name: 'setting_key', length: 60 })
  key: string;

  @Column({ name: 'setting_value', type: 'text' })
  value: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
