import { AppError } from "../errors/app-error.js";
import { supabaseService } from "../../config/supabase.js";

type ListOptions = {
  select?: string;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
};

type ListWhereOptions = ListOptions & {
  where?: Record<string, string | number | boolean | null>;
};

type FindByIdOptions = {
  select?: string;
  idColumn?: string;
};

export class SupabaseRepository<TRecord extends Record<string, unknown>> {
  constructor(private readonly table: string) {}

  async list(options: ListOptions = {}): Promise<TRecord[]> {
    let query = supabaseService
      .from(this.table)
      .select(options.select ?? "*")
      .limit(options.limit ?? 100);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.ascending ?? false,
      });
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to list records from ${this.table}`,
        500,
        error.message,
      );
    }

    return (data ?? []) as unknown as TRecord[];
  }

  async listWhere(options: ListWhereOptions = {}): Promise<TRecord[]> {
    const { where, ...listOpts } = options;
    let query = supabaseService
      .from(this.table)
      .select(options.select ?? "*")
      .limit(options.limit ?? 100);

    if (where) {
      for (const [key, value] of Object.entries(where)) {
        if (value === null || value === undefined) continue;
        query = query.eq(key, value);
      }
    }

    if (listOpts.orderBy) {
      query = query.order(listOpts.orderBy, {
        ascending: listOpts.ascending ?? false,
      });
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to list records from ${this.table}`,
        500,
        error.message,
      );
    }

    return (data ?? []) as unknown as TRecord[];
  }

  async findById(
    id: string,
    options: FindByIdOptions = {},
  ): Promise<TRecord | null> {
    const { data, error } = await supabaseService
      .from(this.table)
      .select(options.select ?? "*")
      .eq(options.idColumn ?? "id", id)
      .maybeSingle();

    if (error) {
      throw new AppError(
        `Failed to find record in ${this.table}`,
        500,
        error.message,
      );
    }

    return (data as unknown as TRecord | null) ?? null;
  }

  async create(payload: Partial<TRecord>): Promise<TRecord> {
    const { data, error } = await supabaseService
      .from(this.table)
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError(
        `Failed to create record in ${this.table}`,
        500,
        error?.message,
      );
    }

    return data as TRecord;
  }

  async update(
    id: string,
    payload: Partial<TRecord>,
    idColumn = "id",
  ): Promise<TRecord> {
    const { data, error } = await supabaseService
      .from(this.table)
      .update(payload)
      .eq(idColumn, id)
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError(
        `Failed to update record in ${this.table}`,
        500,
        error?.message,
      );
    }

    return data as TRecord;
  }

  async remove(id: string, idColumn = "id"): Promise<void> {
    const { error } = await supabaseService
      .from(this.table)
      .delete()
      .eq(idColumn, id);

    if (error) {
      throw new AppError(
        `Failed to delete record in ${this.table}`,
        500,
        error.message,
      );
    }
  }
}
