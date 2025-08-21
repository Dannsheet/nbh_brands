-- supabase/migrations/20240726120000_orden_status_functions.sql

-- Función para verificar un pago, actualizar la orden y descontar el stock.
create or replace function verificar_pago_y_actualizar_stock(p_orden_id uuid, p_comprobante_id uuid)
returns void as $$
declare
  item record;
begin
  -- 1. Validar que el stock sea suficiente para todos los artículos de la orden
  for item in
    select
      oi.cantidad,
      i.stock,
      p.nombre as producto_nombre
    from orden_items oi
    join inventario i on oi.inventario_id = i.id
    join productos p on i.producto_id = p.id
    where oi.orden_id = p_orden_id
  loop
    if item.stock < item.cantidad then
      raise exception 'Stock insuficiente para el producto: %. Stock disponible: %, requerido: %',
        item.producto_nombre, item.stock, item.cantidad;
    end if;
  end loop;

  -- 2. Actualizar el estado del comprobante de pago a 'verificado'
  update comprobantes_pago
  set estado = 'verificado'
  where id = p_comprobante_id;

  -- 3. Actualizar el estado de la orden a 'pagado'
  update ordenes
  set estado = 'pagado'
  where id = p_orden_id;

  -- 4. Descontar el stock del inventario para cada artículo de la orden
  for item in
    select oi.inventario_id, oi.cantidad
    from orden_items oi
    where oi.orden_id = p_orden_id
  loop
    update inventario
    set stock = stock - item.cantidad
    where id = item.inventario_id;
  end loop;

end;
$$ language plpgsql security definer;

-- Función para rechazar un pago y actualizar la orden.
create or replace function rechazar_pago(p_orden_id uuid, p_comprobante_id uuid)
returns void as $$
begin
  -- Actualizar el estado del comprobante de pago a 'rechazado'
  update comprobantes_pago
  set estado = 'rechazado'
  where id = p_comprobante_id;

  -- Actualizar el estado de la orden a 'rechazado'
  update ordenes
  set estado = 'rechazado'
  where id = p_orden_id;
end;
$$ language plpgsql security definer;
