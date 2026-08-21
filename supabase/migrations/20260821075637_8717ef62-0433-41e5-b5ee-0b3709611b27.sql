CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active',
  risk text NOT NULL DEFAULT 'Low',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_date timestamptz NOT NULL DEFAULT now(),
  payment_status text NOT NULL DEFAULT 'success',
  payment_method text NOT NULL DEFAULT 'card',
  failure_reason text
);
CREATE TABLE public.recovery_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  amount_recovered numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  risk_score integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'Low',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_customer ON public.payments(customer_id);
CREATE INDEX idx_actions_customer ON public.recovery_actions(customer_id);
CREATE INDEX idx_risk_customer ON public.risk_scores(customer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers, public.payments, public.recovery_actions, public.risk_scores, public.notifications TO anon, authenticated;
GRANT ALL ON public.customers, public.payments, public.recovery_actions, public.risk_scores, public.notifications TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo open access customers" ON public.customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open access payments" ON public.payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open access recovery_actions" ON public.recovery_actions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open access risk_scores" ON public.risk_scores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open access notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.customers (name, email, amount, status, risk, created_at) VALUES
('Aarav Sharma','aarav.sharma@nimbustech.in',18400,'Failed Payment','High', now() - interval '62 days'),
('Priya Nair','priya.nair@quantleaf.com',24950,'Failed Payment','High', now() - interval '55 days'),
('Rohan Mehta','rohan.mehta@brightpay.io',9200,'At Risk','Medium', now() - interval '48 days'),
('Ananya Iyer','ananya.iyer@finflow.co',31500,'Failed Payment','High', now() - interval '40 days'),
('Vikram Desai','vikram.desai@stackly.dev',4800,'Active','Low', now() - interval '38 days'),
('Sneha Kulkarni','sneha.kulkarni@vertexlabs.in',12750,'At Risk','Medium', now() - interval '35 days'),
('Kabir Malhotra','kabir.malhotra@zenithcrm.com',6400,'Active','Low', now() - interval '33 days'),
('Meera Raghavan','meera.raghavan@orbitpay.in',27300,'Failed Payment','High', now() - interval '30 days'),
('Arjun Bose','arjun.bose@cloudmint.io',8100,'At Risk','Medium', now() - interval '28 days'),
('Ishita Verma','ishita.verma@datagrid.co',3500,'Active','Low', now() - interval '26 days'),
('Devansh Rao','devansh.rao@payloop.in',15600,'At Risk','Medium', now() - interval '24 days'),
('Nikhil Menon','nikhil.menon@subscribr.com',21200,'Failed Payment','High', now() - interval '21 days'),
('Tara Chatterjee','tara.chatterjee@leafly.io',5200,'Active','Low', now() - interval '19 days'),
('Aditya Pillai','aditya.pillai@northbridge.in',10400,'At Risk','Medium', now() - interval '17 days'),
('Riya Kapoor','riya.kapoor@formfast.co',7300,'Recovered','Low', now() - interval '15 days'),
('Karthik Reddy','karthik.reddy@meshworks.dev',19800,'Failed Payment','High', now() - interval '12 days'),
('Neha Joshi','neha.joshi@brewcart.in',2600,'Active','Low', now() - interval '9 days'),
('Siddharth Ghosh','siddharth.ghosh@auralabs.io',14100,'Recovered','Medium', now() - interval '7 days'),
('Pooja Bhatt','pooja.bhatt@trailhead.co',6900,'At Risk','Medium', now() - interval '5 days'),
('Manish Gupta','manish.gupta@relaypay.in',23400,'Failed Payment','High', now() - interval '3 days');

INSERT INTO public.payments (customer_id, amount, payment_date, payment_status, payment_method)
SELECT c.id, round(c.amount * 0.9, 2), now() - (interval '30 days' * g), 'success',
  (ARRAY['card','upi','netbanking','wallet'])[1 + (abs(hashtext(c.email)) % 4)]
FROM public.customers c CROSS JOIN generate_series(1,3) g;

INSERT INTO public.payments (customer_id, amount, payment_date, payment_status, payment_method, failure_reason)
SELECT c.id, c.amount, now() - (interval '4 days' * g), 'failed',
  (ARRAY['card','upi','netbanking','wallet'])[1 + (abs(hashtext(c.email)) % 4)],
  (ARRAY['Insufficient funds','Card expired','Bank declined','Payment gateway timeout','Invalid payment method'])[1 + ((abs(hashtext(c.email)) + g) % 5)]
FROM public.customers c
CROSS JOIN generate_series(1, 2) g
WHERE c.status = 'Failed Payment';

INSERT INTO public.payments (customer_id, amount, payment_date, payment_status, payment_method, failure_reason)
SELECT c.id, c.amount, now() - interval '9 days', 'failed',
  (ARRAY['card','upi','netbanking','wallet'])[1 + (abs(hashtext(c.email)) % 4)],
  (ARRAY['Insufficient funds','Card expired','Bank declined','Payment gateway timeout','Invalid payment method'])[1 + (abs(hashtext(c.email)) % 5)]
FROM public.customers c WHERE c.status = 'At Risk';

INSERT INTO public.recovery_actions (customer_id, action_type, status, amount_recovered, created_at)
SELECT c.id, 'Payment Retry', 'Completed', c.amount, now() - interval '6 days'
FROM public.customers c WHERE c.status = 'Recovered';

INSERT INTO public.recovery_actions (customer_id, action_type, status, amount_recovered, created_at)
SELECT c.id, 'Email Reminder', 'Completed', 0, now() - (interval '2 days' * (1 + (abs(hashtext(c.email)) % 8)))
FROM public.customers c WHERE c.status IN ('Failed Payment','At Risk');

INSERT INTO public.recovery_actions (customer_id, action_type, status, amount_recovered, created_at)
SELECT c.id, 'Payment Retry', 'Failed', 0, now() - (interval '3 days' * (1 + (abs(hashtext(c.email)) % 5)))
FROM public.customers c WHERE c.status = 'Failed Payment';

INSERT INTO public.recovery_actions (customer_id, action_type, status, amount_recovered, created_at)
SELECT c.id, 'Payment Retry', 'Completed', round(c.amount * 0.4, 2), now() - (interval '1 day' * g)
FROM public.customers c
CROSS JOIN generate_series(1, 28) g
WHERE c.risk = 'Low' AND (abs(hashtext(c.email)) + g) % 3 = 0;

INSERT INTO public.notifications (title, message, type, created_at) VALUES
('New high-risk customer detected','Manish Gupta moved to high risk after a failed payment.','warning', now() - interval '2 hours'),
('Payment recovery successful','Riya Kapoor''s payment was recovered automatically.','success', now() - interval '1 day'),
('Reminder sent successfully','Payment reminders were sent to 6 at-risk customers.','info', now() - interval '2 days');