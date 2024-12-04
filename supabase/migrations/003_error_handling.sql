-- Create error logging table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    error_type TEXT NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function for error logging
CREATE OR REPLACE FUNCTION log_error(
    p_error_type TEXT,
    p_message TEXT,
    p_stack_trace TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_error_id UUID;
BEGIN
    INSERT INTO error_logs (
        error_type,
        message,
        stack_trace,
        metadata
    ) VALUES (
        p_error_type,
        p_message,
        p_stack_trace,
        p_metadata
    ) RETURNING id INTO v_error_id;

    RETURN v_error_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for transaction management
CREATE OR REPLACE FUNCTION execute_transaction(
    p_operations TEXT[]
) RETURNS void AS $$
DECLARE
    v_operation TEXT;
BEGIN
    -- Start transaction
    BEGIN
        FOREACH v_operation IN ARRAY p_operations
        LOOP
            EXECUTE v_operation;
        END LOOP;
    EXCEPTION WHEN OTHERS THEN
        -- Log error and rollback
        PERFORM log_error(
            'TRANSACTION_ERROR',
            SQLERRM,
            pg_backend_pid()::text,
            jsonb_build_object('operations', p_operations)
        );
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create connection monitoring function
CREATE OR REPLACE FUNCTION monitor_connections() RETURNS void AS $$
DECLARE
    v_max_connections INTEGER;
    v_used_connections INTEGER;
BEGIN
    SELECT setting::integer INTO v_max_connections
    FROM pg_settings
    WHERE name = 'max_connections';

    SELECT count(*) INTO v_used_connections
    FROM pg_stat_activity;

    -- Log if connection usage is high
    IF v_used_connections > v_max_connections * 0.8 THEN
        PERFORM log_error(
            'CONNECTION_WARNING',
            'High connection usage detected',
            NULL,
            jsonb_build_object(
                'max_connections', v_max_connections,
                'used_connections', v_used_connections
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule connection monitoring
SELECT cron.schedule(
    'monitor_connections',
    '*/5 * * * *',
    $$SELECT monitor_connections()$$
);