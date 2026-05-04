(function ($) {
    "use strict";

    // 1. القائمة العلوية الثابتة والعودة للأعلى
    $(window).scroll(function () {
        $('.navbar').toggleClass('sticky-top shadow-sm', $(this).scrollTop() > 40);
        $(this).scrollTop() > 100 ? $('.back-to-top').fadeIn('slow') : $('.back-to-top').fadeOut('slow');
    });

    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });

    $(document).ready(function () {
        // تحسين القوائم المنسدلة
        function toggleNavbarMethod() {
            if ($(window).width() > 992) {
                $('.navbar .dropdown').hover(
                    function () { $(this).addClass('show').find('.dropdown-menu').addClass('show'); },
                    function () { $(this).removeClass('show').find('.dropdown-menu').removeClass('show'); }
                );
            } else {
                $('.navbar .dropdown').off('mouseenter mouseleave');
            }
        }
        toggleNavbarMethod();
        $(window).resize(toggleNavbarMethod);

        // العدادات والـ Carousel
        if ($('[data-toggle="counter-up"]').length) {
            $('[data-toggle="counter-up"]').counterUp({ delay: 10, time: 2000 });
        }
        $(".testimonial-carousel").owlCarousel({
            autoplay: true, smartSpeed: 1000, margin: 25, dots: true, loop: true,
            responsive: { 0: { items: 1 }, 768: { items: 2 }, 992: { items: 2 } }
        });
    });

})(jQuery);


/**
 * منطق الطلب والبحث (Pure JS) - نسخة محسّنة
 */
document.addEventListener("DOMContentLoaded", function () {

    // ============================
    // المتغيرات العامة
    // ============================
    let selectedSize = null;
    let selectedFlavor = null;

    // عناصر ثابتة في الصفحة (مش جوا المودال)
    const orderBtn   = document.getElementById("orderBtn");
    const qtyInput   = document.getElementById("quantity");
    const cakeModal  = document.getElementById("cakeModal");
    const searchForm = document.getElementById("searchForm");
    const incBtn     = document.getElementById("increaseQty");
    const decBtn     = document.getElementById("decreaseQty");


    // ============================
    // أ. فتح المودال وتعبئة البيانات
    // ============================
    document.addEventListener("click", function (e) {
        const button = e.target.closest(".product-btn");
        if (!button) return;

        // تعبئة بيانات المنتج
        const titleEl = document.getElementById("modalTitle");
        const imageEl = document.getElementById("modalImage");
        const descEl  = document.getElementById("modalDescription");

        if (titleEl) titleEl.textContent = button.dataset.name;
        if (imageEl) imageEl.src = button.dataset.image;
        if (descEl)  descEl.textContent = button.dataset.description;

        // إعادة تعيين الاختيارات
        selectedSize   = null;
        selectedFlavor = null;
        if (qtyInput) qtyInput.value = 1;

        updateOrderButtonState();
        generateOptions("modalSizes",   button.dataset.sizes,   "size");
        generateOptions("modalFlavors", button.dataset.flavors, "flavor");
    });


    // ============================
    // ب. إنشاء خيارات (حجم / نكهة)
    // ============================
    function generateOptions(containerId, optionsString, type) {
        const container = document.getElementById(containerId);
        if (!container || !optionsString) return;
        container.innerHTML = "";

        optionsString.split(",").forEach(function (option) {
            const btn = document.createElement("button");
            btn.type      = "button";
            btn.className = "option-btn btn btn-outline-secondary m-1";
            btn.textContent = option.trim();

            btn.addEventListener("click", function () {
                container.querySelectorAll(".option-btn").forEach(function (b) {
                    b.classList.remove("active", "btn-primary");
                    b.classList.add("btn-outline-secondary");
                });
                btn.classList.add("active", "btn-primary");
                btn.classList.remove("btn-outline-secondary");

                if (type === "size")   selectedSize   = btn.textContent;
                else                   selectedFlavor = btn.textContent;

                updateOrderButtonState();
            });

            container.appendChild(btn);
        });
    }


    // ============================
    // ج. حالة زر "اطلب الآن"
    // ============================
    function updateOrderButtonState() {
        if (!orderBtn) return;
        const isValid = !!(selectedSize && selectedFlavor);
        orderBtn.disabled   = !isValid;
        orderBtn.textContent = isValid ? "اطلب الآن" : "اختر الحجم والنكهة أولاً";
        orderBtn.className   = isValid
            ? "btn btn-primary w-100"
            : "btn btn-secondary w-100";
    }


    // ============================
    // د. التحكم في الكمية
    // ============================
    if (incBtn && qtyInput) {
        incBtn.addEventListener("click", function () {
            qtyInput.value = parseInt(qtyInput.value || 0) + 1;
        });
    }
    if (decBtn && qtyInput) {
        decBtn.addEventListener("click", function () {
            if (parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
        });
    }


    // ============================
    // هـ. إرسال الطلب
    // ============================
    if (orderBtn) {
        orderBtn.addEventListener("click", async function () {

            // FIX: querySelector داخل المودال بس — مش في كل الصفحة
            const modal    = document.getElementById("cakeModal");
            const nameInp  = modal ? modal.querySelector("#customerName")  : document.getElementById("customerName");
            const phoneInp = modal ? modal.querySelector("#customerPhone") : document.getElementById("customerPhone");

            // التحقق من البيانات
            if (!nameInp || !phoneInp) {
                alert("خطأ: حقول الاسم أو الهاتف غير موجودة في الصفحة.");
                return;
            }
            if (!nameInp.value.trim() || !phoneInp.value.trim()) {
                alert("برجاء إدخال اسمك ورقم هاتفك لتأكيد الطلب.");
                return;
            }
            if (!selectedSize || !selectedFlavor) {
                alert("برجاء اختيار الحجم والنكهة.");
                return;
            }

            // حساب السعر
            const unitPrice = parseFloat(selectedSize.split("-")[1]);
            const quantity   = parseInt(qtyInput ? qtyInput.value : 1) || 1;

            const orderData = {
                customer_name:  nameInp.value.trim(),
                customer_phone: phoneInp.value.trim(),
                product_name:   document.getElementById("modalTitle")?.textContent || "",
                size:           selectedSize,
                flavor:         selectedFlavor,
                quantity:       quantity,
                total_price:    unitPrice * quantity
            };

            // تعطيل الزر أثناء الإرسال
            orderBtn.disabled   = true;
            orderBtn.innerHTML  = '<span class="spinner-border spinner-border-sm me-2"></span>جاري الإرسال...';

            try {
                const res  = await fetch("/place_order", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(orderData)
                });

                // التحقق من HTTP status قبل قراءة JSON
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || `HTTP ${res.status}`);
                }

                const data = await res.json();

                if (data.status === "success") {
                    alert("✅ " + data.message);

                    // إغلاق المودال
                    const modalInstance = bootstrap.Modal.getInstance(cakeModal);
                    if (modalInstance) modalInstance.hide();

                    // تنظيف الحقول
                    nameInp.value  = "";
                    phoneInp.value = "";

                    // إعادة تعيين الاختيارات
                    selectedSize   = null;
                    selectedFlavor = null;

                } else {
                    alert("❌ خطأ: " + (data.message || "حدث خطأ غير معروف."));
                }

            } catch (err) {
                alert("❌ فشل في الاتصال بالسيرفر: " + err.message);
            } finally {
                updateOrderButtonState();
            }
        });
    }


    // ============================
    // و. البحث عن الطلبات
    // ============================
    if (searchForm) {
        searchForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const resultsContainer = document.getElementById("resultsContainer");
            const nameEl  = document.getElementById("customer_name");
            const phoneEl = document.getElementById("customer_phone");

            if (!resultsContainer || !nameEl || !phoneEl) return;

            const name  = nameEl.value.trim();
            const phone = phoneEl.value.trim();

            // التحقق من البيانات
            if (!name || !phone) {
                resultsContainer.innerHTML = '<div class="alert alert-warning text-center">برجاء إدخال الاسم ورقم الهاتف.</div>';
                return;
            }

            // مؤشر التحميل
            resultsContainer.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-2 text-muted">جاري البحث...</p>
                </div>`;

            try {
                const response = await fetch("/api/get_orders", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({ name, phone })
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();

                if (data.success && data.orders && data.orders.length > 0) {
                    let html = `<h4 class="mb-4 text-primary">نتائج البحث (${data.orders.length} طلب):</h4>`;

                    data.orders.forEach(function (order) {
                        const date = order.created_at || "—";
                        const price = order.price != null ? order.price : "—";
                        html += `
                            <div class="card mb-3 shadow-sm border-start border-primary border-4 text-end">
                                <div class="card-body">
                                    <h5 class="card-title fw-bold">${escapeHtml(order.product_name || "—")}</h5>
                                    <p class="mb-1 order-details">
                                        الحجم: ${escapeHtml(order.size || "—")} &nbsp;|&nbsp; النكهة: ${escapeHtml(order.flavor || "—")}
                                        &nbsp;|&nbsp; الكمية: ${order.quantity || 1}
                                    </p>
                                    <p class="mb-1 text-danger fw-bold">الإجمالي: ${price} جنيه</p>
                                    <small class="order-date">${escapeHtml(date)}</small>
                                </div>
                            </div>`;
                    });

                    resultsContainer.innerHTML = html;

                } else {
                    resultsContainer.innerHTML = '<div class="alert alert-warning text-center">لا توجد طلبات بهذا الاسم والرقم.</div>';
                }

            } catch (error) {
                resultsContainer.innerHTML = `<div class="alert alert-danger text-center">خطأ في الاتصال بالسيرفر: ${error.message}</div>`;
            }
        });
    }


    // ============================
    // دالة مساعدة: حماية من XSS
    // ============================
    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g,  "&amp;")
            .replace(/</g,  "&lt;")
            .replace(/>/g,  "&gt;")
            .replace(/"/g,  "&quot;")
            .replace(/'/g,  "&#039;");
    }

});